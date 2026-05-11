/**
 * Kansas City experience discovery pipeline.
 * Searches Google Places API (New) for real KC experiences by category,
 * filters out chains and duplicates, then inserts new records into Supabase.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/discoverExperiences.ts
 *
 * Safe to re-run — skips any place already in the DB (by google_place_id).
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL          = process.env.VITE_SUPABASE_URL          || ''
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY   || ''
const GOOGLE_KEY            = process.env.VITE_GOOGLE_MAPS_API_KEY    || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set — get it from Supabase dashboard > Project Settings > API > service_role')
  process.exit(1)
}

// Service role key bypasses RLS so the script can insert new experiences
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// KC city centre — used to bias results toward the metro area
const KC_CENTER = { latitude: 39.0997, longitude: -94.5786 }
const KC_RADIUS_M = 35000 // 35km covers the full metro

// Chains to always exclude
const CHAIN_BLACKLIST = new Set([
  "mcdonald's", "burger king", "wendy's", "taco bell", "kfc", "subway",
  "pizza hut", "domino's", "chick-fil-a", "popeyes", "chipotle", "starbucks",
  "dunkin'", "dunkin", "tim hortons", "five guys", "shake shack", "panera",
  "panera bread", "hardee's", "church's chicken", "jimmy john's", "jersey mike's",
  "firehouse subs", "arby's", "jack in the box", "sonic", "dairy queen",
  "applebee's", "chili's", "olive garden", "red lobster", "ihop", "denny's",
  "outback steakhouse", "buffalo wild wings", "hooters", "panda express",
  "little caesars", "papa john's", "moe's southwest grill", "wingstop",
  "raising cane's", "culver's", "whataburger", "el pollo loco", "habit burger",
  "bar louie", "sarpino's", "planet sub",
])

// Search queries grouped by Vtopia category
const SEARCHES: Array<{ query: string; category: string; experience_type: string }> = [
  // Food & Drink
  { query: 'best BBQ restaurants Kansas City Missouri', category: 'Food & Drink', experience_type: 'restaurant_reserve' },
  { query: 'best brunch restaurants Kansas City Missouri', category: 'Food & Drink', experience_type: 'restaurant_reserve' },
  { query: 'steakhouse Kansas City Missouri', category: 'Food & Drink', experience_type: 'restaurant_reserve' },
  { query: 'craft brewery taproom Kansas City Missouri', category: 'Food & Drink', experience_type: 'food_walkup' },
  { query: 'rooftop bar Kansas City Missouri', category: 'Food & Drink', experience_type: 'food_walkup' },
  { query: 'food hall market Kansas City Missouri', category: 'Food & Drink', experience_type: 'food_walkup' },
  { query: 'coffee shop cafe Kansas City Missouri', category: 'Food & Drink', experience_type: 'food_walkup' },
  { query: 'taco restaurant Kansas City Missouri', category: 'Food & Drink', experience_type: 'food_walkup' },

  // Nightlife
  { query: 'jazz club live music Kansas City Missouri', category: 'Nightlife', experience_type: 'nightlife_walkin' },
  { query: 'live music venue bar Kansas City Missouri', category: 'Nightlife', experience_type: 'nightlife_walkin' },
  { query: 'cocktail bar speakeasy Kansas City Missouri', category: 'Nightlife', experience_type: 'nightlife_walkin' },
  { query: 'rooftop nightlife Kansas City Missouri', category: 'Nightlife', experience_type: 'nightlife_walkin' },

  // Outdoors
  { query: 'hiking trail nature park Kansas City Missouri', category: 'Outdoors', experience_type: 'outdoor_free' },
  { query: 'lake park outdoor recreation Kansas City Missouri', category: 'Outdoors', experience_type: 'outdoor_free' },
  { query: 'kayaking canoeing Kansas City Missouri', category: 'Outdoors', experience_type: 'outdoor_paid' },
  { query: 'bicycle rental cycling Kansas City Missouri', category: 'Outdoors', experience_type: 'outdoor_paid' },
  { query: 'golf course Kansas City Missouri', category: 'Outdoors', experience_type: 'outdoor_paid' },

  // Arts & Culture
  { query: 'museum Kansas City Missouri', category: 'Arts & Culture', experience_type: 'cultural_paid' },
  { query: 'art gallery Kansas City Missouri', category: 'Arts & Culture', experience_type: 'cultural_free' },
  { query: 'theater performing arts Kansas City Missouri', category: 'Arts & Culture', experience_type: 'ticketed' },
  { query: 'historic landmark tour Kansas City Missouri', category: 'Arts & Culture', experience_type: 'cultural_free' },

  // Sports
  { query: 'bowling alley Kansas City Missouri', category: 'Sports', experience_type: 'outdoor_paid' },
  { query: 'rock climbing gym Kansas City Missouri', category: 'Sports', experience_type: 'outdoor_paid' },
  { query: 'go kart racing Kansas City Missouri', category: 'Sports', experience_type: 'outdoor_paid' },
  { query: 'mini golf Kansas City Missouri', category: 'Sports', experience_type: 'outdoor_paid' },
  { query: 'escape room Kansas City Missouri', category: 'Sports', experience_type: 'outdoor_paid' },

  // Wellness
  { query: 'yoga studio Kansas City Missouri', category: 'Wellness', experience_type: 'reservable' },
  { query: 'spa massage Kansas City Missouri', category: 'Wellness', experience_type: 'reservable' },
  { query: 'fitness class studio Kansas City Missouri', category: 'Wellness', experience_type: 'reservable' },
]

const PRICE_LEVEL_TO_PRICE: Record<string, number> = {
  PRICE_LEVEL_FREE:           0,
  PRICE_LEVEL_INEXPENSIVE:    20,
  PRICE_LEVEL_MODERATE:       45,
  PRICE_LEVEL_EXPENSIVE:      90,
  PRICE_LEVEL_VERY_EXPENSIVE: 160,
}

const PRICE_LEVEL_TO_TIER: Record<string, number> = {
  PRICE_LEVEL_INEXPENSIVE:    1,
  PRICE_LEVEL_MODERATE:       2,
  PRICE_LEVEL_EXPENSIVE:      3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

function parseHours(weekdayDescriptions: string[]): Record<string, string> {
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
      const [time, ampm] = t.trim().split(' ').join(' ').split(' ')
      const [h, m = '00'] = time.split(':')
      let hour = parseInt(h, 10)
      if (ampm === 'PM' && hour !== 12) hour += 12
      if (ampm === 'AM' && hour === 12) hour = 0
      return `${hour.toString().padStart(2, '0')}:${m}`
    }
    const parts = timePart.split(' – ')
    if (parts.length === 2) {
      hours[key] = `${to24(parts[0])}-${to24(parts[1])}`
    }
  }
  return hours
}

async function searchPlaces(query: string): Promise<Array<Record<string, unknown>>> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.rating',
        'places.userRatingCount',
        'places.priceLevel',
        'places.websiteUri',
        'places.regularOpeningHours',
        'places.location',
        'places.editorialSummary',
        'places.primaryType',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 20,
      locationBias: {
        circle: { center: KC_CENTER, radius: KC_RADIUS_M },
      },
    }),
  })

  const data = await res.json() as { places?: Array<Record<string, unknown>> }
  return data.places || []
}

async function run() {
  if (!GOOGLE_KEY) { console.error('VITE_GOOGLE_MAPS_API_KEY not set'); process.exit(1) }

  // Load existing google_place_ids to skip duplicates
  const { data: existing } = await supabase
    .from('experiences')
    .select('google_place_id')
    .not('google_place_id', 'is', null)

  const existingIds = new Set((existing || []).map((r: { google_place_id: string }) => r.google_place_id))
  console.log(`Existing experiences with place ID: ${existingIds.size}`)

  let totalInserted = 0
  let totalSkipped  = 0

  for (const search of SEARCHES) {
    console.log(`\nSearching: "${search.query}"`)
    const places = await searchPlaces(search.query)
    console.log(`  Found ${places.length} results`)

    for (const place of places) {
      const placeId = place.id as string
      const name    = (place.displayName as { text: string })?.text || ''

      // Skip duplicates already in DB
      if (existingIds.has(placeId)) { totalSkipped++; continue }

      // Skip chains
      if (CHAIN_BLACKLIST.has(name.toLowerCase())) {
        console.log(`  ⛔ Chain skipped: ${name}`)
        totalSkipped++
        continue
      }

      // Skip low-credibility entries (fewer than 10 reviews)
      const reviewCount = (place.userRatingCount as number) || 0
      if (reviewCount < 10) { totalSkipped++; continue }

      const priceStr    = place.priceLevel as string | undefined
      const price       = priceStr ? (PRICE_LEVEL_TO_PRICE[priceStr] ?? 0) : 0
      const priceTier   = priceStr ? (PRICE_LEVEL_TO_TIER[priceStr] ?? null) : null
      const location    = place.location as { latitude: number; longitude: number } | undefined
      const summary     = (place.editorialSummary as { text: string } | undefined)?.text || null
      const hours       = (place.regularOpeningHours as { weekdayDescriptions?: string[] })?.weekdayDescriptions
        ? parseHours((place.regularOpeningHours as { weekdayDescriptions: string[] }).weekdayDescriptions)
        : null

      const record = {
        title:             name,
        description:       summary,
        city:              'Kansas City',
        category:          search.category,
        experience_type:   search.experience_type,
        price_per_person:  price,
        price_tier:        priceTier,
        external_url:      (place.websiteUri as string) || null,
        requires_booking:  ['reservable', 'restaurant_reserve', 'ticketed'].includes(search.experience_type),
        is_active:         true,
        tags:              [search.category],
        google_place_id:   placeId,
        google_rating:     (place.rating as number) || null,
        google_review_count: reviewCount || null,
        google_price_level:  priceTier,
        place_website:     (place.websiteUri as string) || null,
        hours:             hours,
        lat:               location?.latitude || null,
        lng:               location?.longitude || null,
        data_freshness:    new Date().toISOString(),
        quality_score:     summary && hours ? 80 : hours || summary ? 70 : 60,
      }

      const { error } = await supabase.from('experiences').insert(record)

      if (error) {
        console.log(`  ✗ Failed to insert "${name}": ${error.message}`)
      } else {
        console.log(`  ✓ Added: ${name} (${search.category}, ⭐${place.rating ?? '?'}, ${reviewCount} reviews)`)
        existingIds.add(placeId)
        totalInserted++
      }
    }

    await sleep(500) // stay well under rate limits
  }

  console.log(`\n✅ Done. Inserted: ${totalInserted} | Skipped: ${totalSkipped}`)
}

run().catch(console.error)
