/**
 * Fetches real Google Places photos for all active KC experiences that have
 * a google_place_id but no image_url, then writes the permanent photo URL
 * back to the experiences table.
 *
 * Cost estimate: ~$0.012 per experience (Places Details + Photo = $24/1000)
 * 524 experiences ≈ $6-8 total one-time cost.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/fetchPlacePhotos.ts
 *
 * Safe to re-run — skips any experience that already has an image_url.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL         || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const GOOGLE_KEY           = process.env.VITE_GOOGLE_MAPS_API_KEY  || ''

if (!SUPABASE_SERVICE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }
if (!GOOGLE_KEY)           { console.error('VITE_GOOGLE_MAPS_API_KEY not set');  process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep    = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Step 1: get a photo name from the Places Details endpoint ─────────────────
async function getPhotoName(placeId: string): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=photos&key=${GOOGLE_KEY}`
  const res  = await fetch(url)
  if (!res.ok) return null
  const data = await res.json() as { photos?: Array<{ name: string }> }
  return data.photos?.[0]?.name ?? null
}

// ── Step 2: resolve the photo name → permanent CDN URL ────────────────────────
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
  .select('id, title, google_place_id')
  .eq('is_active', true)
  .eq('city', 'Kansas City')
  .not('google_place_id', 'is', null)
  .or('image_url.is.null,image_url.eq.')
  .order('title')

if (error) { console.error('Query failed:', error.message); process.exit(1) }
if (!data?.length) { console.log('All experiences already have images — nothing to do.'); process.exit(0) }

console.log(`Fetching real photos for ${data.length} experiences…`)
console.log('Estimated time: ~' + Math.ceil(data.length * 0.6 / 60) + ' minutes\n')

let updated  = 0
let noPhoto  = 0
let failed   = 0

for (let i = 0; i < data.length; i++) {
  const exp = data[i]
  process.stdout.write(`[${i + 1}/${data.length}] ${exp.title.slice(0, 45).padEnd(45)} `)

  try {
    const photoName = await getPhotoName(exp.google_place_id!)
    if (!photoName) {
      console.log('— no photo')
      noPhoto++
      await sleep(300)
      continue
    }

    const photoUri = await resolvePhotoUri(photoName)
    if (!photoUri) {
      console.log('— photo resolve failed')
      noPhoto++
      await sleep(300)
      continue
    }

    const { error: err } = await supabase
      .from('experiences')
      .update({ image_url: photoUri })
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

  await sleep(400) // ~2-3 req/s — well within Places API limits
}

console.log(`\n────────────────────────────────────`)
console.log(`Updated:   ${updated}`)
console.log(`No photo:  ${noPhoto}  (will use category fallback from assignCategoryImages.ts)`)
console.log(`Failed:    ${failed}`)
console.log(`────────────────────────────────────`)

// Assign category fallbacks to anything still missing
if (noPhoto > 0 || failed > 0) {
  console.log(`\nRun scripts/assignCategoryImages.ts to fill remaining gaps.`)
}
