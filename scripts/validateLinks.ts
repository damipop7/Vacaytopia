/**
 * Link validation pipeline.
 * Checks every external URL in the experiences table and marks each as
 * verified, unverified, or broken based on HTTP HEAD response.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/validateLinks.ts
 *
 * Safe to re-run — only updates records where link_status != 'verified'
 * or where the URL changed since last check.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL         || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// Trusted booking/ordering domains — links to these are considered valid format
const TRUSTED_DOMAINS = new Set([
  'doordash.com', 'ubereats.com', 'grubhub.com', 'toasttab.com',
  'opentable.com', 'resy.com', 'tock.com', 'exploretock.com',
  'yelp.com', 'eventbrite.com', 'ticketmaster.com', 'axs.com',
  'viator.com', 'getyourguide.com', 'klook.com',
  'booking.com', 'airbnb.com',
])

// URL path segments that indicate a specific booking/ordering page
const VALID_PATH_PATTERNS = [
  '/order', '/reserve', '/book', '/menu', '/tickets',
  '/reservations', '/checkout', '/buy', '/purchase',
]

function isWellFormedBookingUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (TRUSTED_DOMAINS.has(host)) return true
    return VALID_PATH_PATTERNS.some(p => u.pathname.toLowerCase().includes(p))
  } catch {
    return false
  }
}

async function checkUrl(url: string): Promise<'verified' | 'broken'> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Vtopia-LinkValidator/1.0' },
    })
    clearTimeout(timeout)

    if (res.status >= 200 && res.status < 400) return 'verified'
    return 'broken'
  } catch {
    return 'broken'
  }
}

async function run() {
  const { data: experiences, error } = await supabase
    .from('experiences')
    .select('id, title, external_url, ticket_url, delivery_url, website, link_status')
    .eq('is_active', true)
    .neq('link_status', 'verified')
    .limit(200)

  if (error) { console.error('Fetch error:', error.message); process.exit(1) }
  if (!experiences?.length) { console.log('All links already verified.'); return }

  console.log(`Checking ${experiences.length} experiences...\n`)

  let verified = 0, broken = 0, unverified = 0

  for (const exp of experiences) {
    const primaryUrl = exp.external_url || exp.ticket_url || exp.delivery_url || exp.website

    if (!primaryUrl) {
      await supabase.from('experiences').update({ link_status: 'unverified' }).eq('id', exp.id)
      unverified++
      console.log(`  ? ${exp.title} — no URL`)
      continue
    }

    const wellFormed = isWellFormedBookingUrl(primaryUrl)
    if (!wellFormed) {
      // Generic homepage or unclear URL — mark unverified without hitting it
      await supabase.from('experiences').update({ link_status: 'unverified' }).eq('id', exp.id)
      unverified++
      console.log(`  ? ${exp.title} — URL not specific (${primaryUrl})`)
      await sleep(100)
      continue
    }

    const status = await checkUrl(primaryUrl)
    await supabase.from('experiences').update({ link_status: status }).eq('id', exp.id)

    if (status === 'verified') { verified++; console.log(`  ✓ ${exp.title}`) }
    else                       { broken++;   console.log(`  ✗ ${exp.title} — broken (${primaryUrl})`) }

    await sleep(500)
  }

  console.log(`\nDone. Verified: ${verified} | Broken: ${broken} | Unverified: ${unverified}`)
}

run().catch(console.error)
