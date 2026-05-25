/**
 * LIVE INTEGRATION: Experience "Go to website" link health check
 *
 * Fetches every active experience from Supabase and verifies that all
 * external URL fields (the ones behind "Go to website" CTAs) respond
 * with a non-error HTTP status.
 *
 * Run with:
 *   npm run test:live
 *
 * A failure here means users are clicking dead links on experience pages.
 * Fix broken links at: https://www.vtopia.world/admin/links
 *
 * NOTE: Requires VITE_SUPABASE_ANON_KEY in .env
 * NOTE: URLs already marked link_status = 'broken' in admin are skipped —
 *       we already know those are dead; fix them in the admin console.
 */
import { describe, it, expect, beforeAll } from 'vitest'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const ANON_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// All URL columns that feed the "Go to website" / booking CTAs
const URL_FIELDS = ['external_url', 'ticket_url', 'delivery_url', 'website']

// Google Maps URLs are generated dynamically at runtime — skip them
const MAPS_RE = /maps\.google\.com|google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/i

async function fetchAllExperiences() {
  const params = new URLSearchParams({
    select:   'id,title,city,category,experience_type,link_status,external_url,ticket_url,delivery_url,website',
    is_active: 'eq.true',
    limit:    '500',
  })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/experiences?${params}`, {
    headers: {
      apikey:        ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${res.statusText}`)
  return res.json()
}

async function checkUrl(url, timeoutMs = 12000) {
  const ctrl = new AbortController()
  const tid  = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method:   'HEAD',
      signal:   ctrl.signal,
      redirect: 'follow',
    })
    return { ok: res.status < 400, status: res.status }
  } catch (err) {
    if (ctrl.signal.aborted) return { ok: false, status: 'TIMEOUT' }
    // Some servers block HEAD — retry with GET and stream only headers
    try {
      const res2 = await fetch(url, {
        method:   'GET',
        signal:   AbortSignal.timeout(timeoutMs),
        redirect: 'follow',
      })
      return { ok: res2.status < 400, status: res2.status }
    } catch {
      return { ok: false, status: err.message.slice(0, 60) }
    }
  } finally {
    clearTimeout(tid)
  }
}

// Run checks in parallel batches to stay fast without hammering servers
async function checkAll(cases, concurrency = 8) {
  const results = []
  for (let i = 0; i < cases.length; i += concurrency) {
    const batch = cases.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (c) => {
        const { ok, status } = await checkUrl(c.url)
        return { ...c, ok, status }
      })
    )
    results.push(...batchResults)
  }
  return results
}

// ── Tests ─────────────────────────────────────────────────────────────────────

let experiences = []

describe('Experience website links (LIVE)', () => {

  it('VITE_SUPABASE_ANON_KEY is configured', () => {
    expect(
      ANON_KEY.length,
      'VITE_SUPABASE_ANON_KEY is missing from .env — cannot fetch experiences'
    ).toBeGreaterThan(10)
  })

  beforeAll(async () => {
    if (!ANON_KEY) return
    experiences = await fetchAllExperiences()
  }, 30000)

  it('experiences table is reachable and has data', () => {
    expect(
      experiences.length,
      'No experiences returned — check Supabase connection or RLS policy'
    ).toBeGreaterThan(0)
  })

  it('all experience URLs are parseable (no invalid URL strings)', () => {
    const invalid  = []
    const httpOnly = []

    for (const exp of experiences) {
      for (const field of URL_FIELDS) {
        const url = exp[field]
        if (!url || MAPS_RE.test(url)) continue
        try {
          const parsed = new URL(url)
          if (parsed.protocol === 'http:') {
            httpOnly.push(`[${exp.city}] ${exp.title} → ${field}: ${url}`)
          }
        } catch {
          invalid.push(`[${exp.city}] ${exp.title} → ${field}: "${url}" is not a valid URL`)
        }
      }
    }

    if (httpOnly.length > 0) {
      // HTTP isn't broken — most redirect to HTTPS — but the DB should store https:// directly.
      // These are flagged as a console warning, not a test failure.
      console.warn(
        `\n[Warning] ${httpOnly.length} experience(s) store http:// URLs — update to https:// in DB:\n` +
        httpOnly.slice(0, 20).map(h => `  • ${h}`).join('\n') +
        (httpOnly.length > 20 ? `\n  … and ${httpOnly.length - 20} more` : '')
      )
    }

    if (invalid.length > 0) {
      expect.fail(
        `${invalid.length} unparseable URL(s) found — fix in Supabase:\n\n` +
        invalid.map(m => `  • ${m}`).join('\n')
      )
    }
  })

  it('no broken links among active experiences', { timeout: 180000 }, async () => {
    // Build test cases: skip nulls, Maps URLs, and admin-flagged-broken links
    const cases = []
    for (const exp of experiences) {
      for (const field of URL_FIELDS) {
        const url = exp[field]
        if (!url || MAPS_RE.test(url)) continue
        if (exp.link_status === 'broken') continue // already flagged in admin
        try { new URL(url) } catch { continue }    // skip malformed (caught above)
        cases.push({ id: exp.id, title: exp.title, city: exp.city, field, url, linkStatus: exp.link_status })
      }
    }

    if (cases.length === 0) {
      console.log('No URLs to check (all experiences have no links or are flagged broken)')
      return
    }

    console.log(`Checking ${cases.length} URLs across ${experiences.length} experiences…`)

    const results  = await checkAll(cases)
    const verified = results.filter(r => r.ok && r.linkStatus === 'unverified')

    // 403/405: server is reachable but blocks bots — likely fine for real users
    const botBlocked = results.filter(r => r.status === 403 || r.status === 405)
    // Truly dead: 404, 4xx (not 403/405), 5xx, TIMEOUT, fetch failed
    const dead = results.filter(r =>
      !r.ok &&
      r.status !== 403 &&
      r.status !== 405
    )

    if (verified.length > 0) {
      console.log(
        `\n[Info] ${verified.length} links respond OK but are still marked "unverified" in admin.` +
        ' Consider marking them verified at /admin/links.\n'
      )
    }

    if (botBlocked.length > 0) {
      console.warn(
        `\n[Warning] ${botBlocked.length} URL(s) returned 403/405 — likely bot-blocking, fine for real users.\n` +
        `  Verify these manually before marking broken:\n` +
        botBlocked.map(b => `  • [${b.city}] ${b.title} → ${b.field}: ${b.url}`).join('\n') + '\n'
      )
    }

    if (dead.length > 0) {
      const report = dead
        .map(b =>
          `  • [${b.city}] ${b.title}\n` +
          `    Field: ${b.field}\n` +
          `    URL:   ${b.url}\n` +
          `    HTTP:  ${b.status}\n` +
          `    Fix:   /admin/links  (id: ${b.id})`
        )
        .join('\n\n')

      expect.fail(
        `${dead.length} dead experience link(s) — users are hitting broken CTAs:\n\n${report}\n\n` +
        `Mark each as "broken" at https://www.vtopia.world/admin/links to hide them from users.`
      )
    }
  })

  it('no experience has an empty string URL instead of null', () => {
    const empties = []
    for (const exp of experiences) {
      for (const field of URL_FIELDS) {
        if (exp[field] === '') {
          empties.push(`[${exp.city}] ${exp.title} → ${field} is "" (should be NULL)`)
        }
      }
    }
    if (empties.length > 0) {
      expect.fail(
        `${empties.length} experience(s) have empty-string URLs (DB should store NULL not ""):\n` +
        empties.map(e => `  • ${e}`).join('\n')
      )
    }
  })
})
