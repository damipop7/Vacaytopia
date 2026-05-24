/**
 * Link validation pipeline.
 * Checks every external URL in the experiences table and marks each as
 * verified, unverified, or broken based on HTTP HEAD response.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/validateLinks.ts          # skip already-verified
 *   npx tsx --env-file=.env scripts/validateLinks.ts --force  # re-check everything
 *
 * Safe to re-run — only updates records where link_status != 'verified'
 * unless --force is passed.
 */

import { createClient } from '@supabase/supabase-js'
import { isMapsUrl, isWellFormedBookingUrl } from '../src/lib/linkValidation.js'

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL         || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const FORCE                = process.argv.includes('--force')
const CONCURRENCY          = 6
const TIMEOUT_MS           = 8000

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── HTTP check ────────────────────────────────────────────────────────────────

async function checkUrl(url: string): Promise<'verified' | 'broken'> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Vtopia-LinkValidator/1.0' },
    })
    clearTimeout(timer)
    return res.status >= 200 && res.status < 400 ? 'verified' : 'broken'
  } catch {
    return 'broken'
  }
}

// ── Concurrency limiter ───────────────────────────────────────────────────────

function pool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = Array(tasks.length)
    let started = 0, finished = 0

    function next() {
      if (started === tasks.length) return
      const idx = started++
      tasks[idx]()
        .then(r => { results[idx] = r; finished++; finished === tasks.length ? resolve(results) : next() })
        .catch(reject)
    }

    for (let i = 0; i < Math.min(limit, tasks.length); i++) next()
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const query = supabase
    .from('experiences')
    .select('id, title, external_url, ticket_url, delivery_url, maps_url, website, link_status')
    .eq('is_active', true)
    .limit(500)

  if (!FORCE) query.neq('link_status', 'verified')

  const { data: experiences, error } = await query
  if (error) { console.error('Fetch error:', error.message); process.exit(1) }
  if (!experiences?.length) { console.log('Nothing to check.'); return }

  console.log(`Checking ${experiences.length} experiences (concurrency=${CONCURRENCY})…\n`)

  let nVerified = 0, nBroken = 0, nUnverified = 0

  const tasks = experiences.map(exp => async () => {
    // maps_url is always structurally valid — auto-verify without a HEAD request
    if (exp.maps_url && isMapsUrl(exp.maps_url) && !exp.external_url && !exp.ticket_url) {
      await supabase.from('experiences').update({ link_status: 'verified' }).eq('id', exp.id)
      nVerified++
      console.log(`  ✓ ${exp.title} — maps URL auto-verified`)
      return
    }

    const primaryUrl = exp.external_url || exp.ticket_url || exp.delivery_url || exp.website

    if (!primaryUrl) {
      await supabase.from('experiences').update({ link_status: 'unverified' }).eq('id', exp.id)
      nUnverified++
      console.log(`  ? ${exp.title} — no URL`)
      return
    }

    if (!isWellFormedBookingUrl(primaryUrl)) {
      await supabase.from('experiences').update({ link_status: 'unverified' }).eq('id', exp.id)
      nUnverified++
      console.log(`  ? ${exp.title} — generic URL (${primaryUrl})`)
      return
    }

    const status = await checkUrl(primaryUrl)
    await supabase.from('experiences').update({ link_status: status }).eq('id', exp.id)

    if (status === 'verified') { nVerified++;   console.log(`  ✓ ${exp.title}`) }
    else                       { nBroken++;     console.log(`  ✗ ${exp.title} — broken (${primaryUrl})`) }
  })

  await pool(tasks, CONCURRENCY)

  console.log(`\nDone.  ✓ Verified: ${nVerified}  ✗ Broken: ${nBroken}  ? Unverified: ${nUnverified}`)
}

run().catch(console.error)
