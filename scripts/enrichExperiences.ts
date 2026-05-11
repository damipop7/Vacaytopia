/**
 * Data enrichment pipeline.
 * Fetches Google Places + Foursquare data for each experience and upserts
 * enriched fields back into the Supabase database.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... \
 *   VITE_GOOGLE_MAPS_API_KEY=... VITE_FOURSQUARE_API_KEY=... \
 *   npx tsx scripts/enrichExperiences.ts
 *
 * Safe to re-run — uses upsert with conflict handling.
 * Respects free-tier rate limits: 1 req/s per API.
 */

import { createClient } from '@supabase/supabase-js'
import { validateExperience } from '../src/lib/dataValidator'

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''
const GOOGLE_KEY        = process.env.VITE_GOOGLE_MAPS_API_KEY || ''
const FOURSQUARE_KEY    = process.env.VITE_FOURSQUARE_API_KEY  || ''
const STALE_DAYS        = 30

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

interface Experience {
  id: string
  title: string
  city: string
  category: string
  lat: number | null
  lng: number | null
  data_freshness: string | null
  [key: string]: unknown
}

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE:           0,
  PRICE_LEVEL_INEXPENSIVE:    1,
  PRICE_LEVEL_MODERATE:       2,
  PRICE_LEVEL_EXPENSIVE:      3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

async function fetchGooglePlaces(exp: Experience): Promise<Record<string, unknown> | null> {
  if (!GOOGLE_KEY) return null

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.id,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri,places.regularOpeningHours',
    },
    body: JSON.stringify({ textQuery: `${exp.title} ${exp.city}` }),
  })

  const data = await res.json() as { places?: Array<Record<string, unknown>> }
  if (!data.places?.length) return null

  const place = data.places[0]
  const priceStr = place.priceLevel as string | undefined

  return {
    google_place_id:     place.id,
    google_rating:       place.rating,
    google_review_count: place.userRatingCount,
    google_price_level:  priceStr ? (PRICE_LEVEL_MAP[priceStr] ?? null) : null,
    place_website:       (place.websiteUri as string) || null,
    hours:               (place.regularOpeningHours as { weekdayDescriptions?: string[] })?.weekdayDescriptions
      ? parseGoogleHours((place.regularOpeningHours as { weekdayDescriptions: string[] }).weekdayDescriptions)
      : null,
  }
}

function parseGoogleHours(weekdayDescriptions: string[]): Record<string, string> {
  const DAY_MAP: Record<string, string> = {
    Monday: 'mon', Tuesday: 'tue', Wednesday: 'wed', Thursday: 'thu',
    Friday: 'fri', Saturday: 'sat', Sunday: 'sun',
  }
  const hours: Record<string, string> = {}
  for (const line of weekdayDescriptions) {
    const [dayPart, timePart] = line.split(': ')
    const key = DAY_MAP[dayPart?.trim()]
    if (!key) continue
    if (!timePart || timePart.toLowerCase() === 'closed') { hours[key] = 'closed'; continue }
    const to24 = (t: string) => {
      const [time, ampm] = t.trim().split(' ')
      const [h, m = '00'] = time.split(':')
      let hour = parseInt(h, 10)
      if (ampm === 'PM' && hour !== 12) hour += 12
      if (ampm === 'AM' && hour === 12) hour = 0
      return `${hour.toString().padStart(2, '0')}:${m}`
    }
    const [open, close] = timePart.split(' – ').map(to24)
    if (open && close) hours[key] = `${open}-${close}`
  }
  return hours
}

async function fetchFoursquare(exp: Experience): Promise<Record<string, unknown> | null> {
  if (!FOURSQUARE_KEY) return null
  const query = encodeURIComponent(exp.title)
  const ll    = exp.lat && exp.lng ? `&ll=${exp.lat},${exp.lng}` : ''
  const url   = `https://api.foursquare.com/v3/places/search?query=${query}${ll}&near=${encodeURIComponent(exp.city)}&limit=1`

  const res  = await fetch(url, { headers: { Authorization: FOURSQUARE_KEY } })
  const data = await res.json() as { results?: Array<{ fsq_id: string; categories?: Array<{ name: string }> }> }
  if (!data.results?.length) return null
  const place = data.results[0]
  return {
    foursquare_id: place.fsq_id,
    foursquare_tips: place.categories?.map(c => c.name) ?? [],
  }
}

async function run() {
  // Fetch stale or unenriched records (not refreshed in 30+ days)
  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: experiences, error } = await supabase
    .from('experiences')
    .select('id, title, city, category, lat, lng, data_freshness')
    .eq('is_active', true)
    .or(`data_freshness.is.null,data_freshness.lt.${cutoff}`)
    .order('data_freshness', { ascending: true, nullsFirst: true })
    .limit(50)

  if (error) { console.error('Failed to fetch experiences:', error); process.exit(1) }
  if (!experiences?.length) { console.log('All records up to date.'); return }

  console.log(`Enriching ${experiences.length} experiences...`)

  for (const exp of experiences as Experience[]) {
    console.log(`  → ${exp.title} (${exp.city})`)

    const [googleData, fsqData] = await Promise.allSettled([
      fetchGooglePlaces(exp),
      fetchFoursquare(exp),
    ])

    const enriched: Record<string, unknown> = {
      id:             exp.id,
      data_freshness: new Date().toISOString(),
    }

    if (googleData.status === 'fulfilled' && googleData.value) {
      Object.assign(enriched, googleData.value)
    }
    if (fsqData.status === 'fulfilled' && fsqData.value) {
      Object.assign(enriched, fsqData.value)
    }

    // Compute quality score
    const validation = validateExperience({ ...exp, ...enriched } as Parameters<typeof validateExperience>[0])
    enriched.quality_score = validation.qualityScore

    const { error: upsertErr } = await supabase
      .from('experiences')
      .update(enriched)
      .eq('id', exp.id)

    if (upsertErr) {
      console.warn(`    Failed to update ${exp.id}:`, upsertErr.message)
    } else {
      console.log(`    Score: ${enriched.quality_score}/100`)
    }

    await sleep(1100) // Respect free-tier rate limits (1 req/s)
  }

  console.log('Done.')
}

run().catch(console.error)
