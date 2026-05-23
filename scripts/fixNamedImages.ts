/**
 * Replaces generic category-fallback Unsplash images with accurate venue photos
 * fetched via Google Places Text Search (searches by experience title + city).
 *
 * Targets experiences whose image_url contains "unsplash.com" — these got a
 * generic category photo (e.g. a soccer stadium for a weightlifting club) from
 * assignCategoryImages.ts. For each one it:
 *   1. Searches Google Places Text Search for the venue name + "Kansas City"
 *   2. Takes the top result's place_id
 *   3. Fetches the first photo via Places Details
 *   4. Resolves the photo to a permanent CDN URL
 *   5. Updates image_url in the DB
 *
 * Experiences with no match are left unchanged (keep the category fallback).
 *
 * Cost estimate: ~$0.017/experience (Text Search $0.005 + Details $0.007 + Photo $0.005)
 * 90 remaining Unsplash experiences ≈ $1.50 total.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/fixNamedImages.ts
 *
 * Safe to re-run — skips anything that already has a non-Unsplash image_url.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL         || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const GOOGLE_KEY           = process.env.VITE_GOOGLE_MAPS_API_KEY  || ''

if (!SUPABASE_SERVICE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }
if (!GOOGLE_KEY)           { console.error('VITE_GOOGLE_MAPS_API_KEY not set');  process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep    = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Step 1: text search for venue by name ─────────────────────────────────────
async function searchPlaceId(title: string, city: string): Promise<string | null> {
  const query    = encodeURIComponent(`${title} ${city}`)
  const url      = `https://places.googleapis.com/v1/places:searchText`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({ textQuery: `${title} ${city}`, maxResultCount: 1 }),
  })
  if (!res.ok) return null
  const data = await res.json() as { places?: Array<{ id: string }> }
  return data.places?.[0]?.id ?? null
}

// ── Step 2: get a photo name from Places Details ──────────────────────────────
async function getPhotoName(placeId: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=photos&key=${GOOGLE_KEY}`
  const res  = await fetch(url)
  if (!res.ok) return null
  const data = await res.json() as { photos?: Array<{ name: string }> }
  return data.photos?.[0]?.name ?? null
}

// ── Step 3: resolve photo name → permanent CDN URL ────────────────────────────
async function resolvePhotoUri(photoName: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true&key=${GOOGLE_KEY}`
  const res  = await fetch(url)
  if (!res.ok) return null
  const data = await res.json() as { photoUri?: string }
  return data.photoUri ?? null
}

// ── Main ──────────────────────────────────────────────────────────────────────
const { data, error } = await supabase
  .from('experiences')
  .select('id, title, city, category')
  .eq('is_active', true)
  .like('image_url', '%unsplash.com%')
  .order('title')

if (error) { console.error('Query failed:', error.message); process.exit(1) }
if (!data?.length) {
  console.log('No Unsplash fallback images found — all experiences have real photos.')
  process.exit(0)
}

console.log(`Fixing images for ${data.length} experiences with generic category photos…`)
console.log('Estimated time: ~' + Math.ceil(data.length * 1.2 / 60) + ' minutes\n')

let updated  = 0
let noMatch  = 0
let failed   = 0

for (let i = 0; i < data.length; i++) {
  const exp = data[i]
  process.stdout.write(`[${i + 1}/${data.length}] ${exp.title.slice(0, 50).padEnd(50)} `)

  try {
    const placeId = await searchPlaceId(exp.title, exp.city)
    if (!placeId) {
      console.log('— no Places match')
      noMatch++
      await sleep(300)
      continue
    }

    const photoName = await getPhotoName(placeId)
    if (!photoName) {
      console.log('— no photo')
      noMatch++
      await sleep(300)
      continue
    }

    const photoUri = await resolvePhotoUri(photoName)
    if (!photoUri) {
      console.log('— photo resolve failed')
      noMatch++
      await sleep(300)
      continue
    }

    const { error: err } = await supabase
      .from('experiences')
      .update({ image_url: photoUri, google_place_id: placeId })
      .eq('id', exp.id)

    if (err) {
      console.log(`— DB error: ${err.message}`)
      failed++
    } else {
      console.log('✓')
      updated++
    }
  } catch (e) {
    console.log(`— exception: ${(e as Error).message}`)
    failed++
  }

  await sleep(500) // ~2 req/s — within Places API limits
}

console.log(`\n────────────────────────────────────────`)
console.log(`Updated:   ${updated}  (real venue photos)`)
console.log(`No match:  ${noMatch}  (kept category fallback)`)
console.log(`Failed:    ${failed}`)
console.log(`────────────────────────────────────────`)
