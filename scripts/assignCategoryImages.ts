/**
 * Assigns curated category-appropriate Unsplash photos to all active KC
 * experiences that have no image_url. Uses a pool of hand-picked photos
 * per category — varied enough to look good, zero API cost.
 *
 * Run post-launch enrichExperiences.ts to replace with real Google Places photos.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/assignCategoryImages.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL         || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
if (!SUPABASE_SERVICE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Curated Unsplash photo pools per category — w=800&q=80 for consistent sizing
const PHOTO_POOLS: Record<string, string[]> = {
  'Food & Drink': [
    'https://images.unsplash.com/photo-1544025162-d76538b367f0?w=800&q=80', // BBQ ribs
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', // grilled meat
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', // restaurant table
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', // restaurant interior
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', // food spread
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', // pizza / casual food
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80', // coffee shop
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80', // craft cocktail
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80', // burger
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80', // pan cooking
  ],
  'Outdoors': [
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80', // park path
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', // mountain trail
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', // forest trail
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', // cycling
    'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?w=800&q=80', // kayaking
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80', // city park
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80', // running trail
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80', // green park
  ],
  'Nightlife': [
    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80', // bar interior
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80', // cocktail bar
    'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&q=80', // restaurant bar
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&q=80', // live music venue
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80', // jazz
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80', // neon bar
    'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&q=80', // night city
    'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&q=80', // rooftop bar
  ],
  'Arts & Culture': [
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&q=80', // art museum
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&q=80', // gallery wall
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80', // art installation
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80', // theater
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80', // concert hall
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80', // street mural
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80', // museum hall
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80', // art exhibit
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80', // stadium
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80', // soccer stadium
    'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800&q=80', // football field
    'https://images.unsplash.com/photo-1540747913346-19212a4b423b?w=800&q=80', // baseball stadium
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80', // sports action
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80', // soccer ball
    'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80', // fan crowd
  ],
  'Wellness': [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', // yoga
    'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80', // spa
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80', // massage
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', // fitness
    'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80', // meditation
    'https://images.unsplash.com/photo-1559595500-e15296bdbb48?w=800&q=80', // wellness retreat
  ],
}

// Fallback for unknown categories
const FALLBACK_POOL = [
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80', // city skyline
  'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=800&q=80', // urban street
  'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80', // city life
]

function pickPhoto(category: string, index: number): string {
  const pool = PHOTO_POOLS[category] ?? FALLBACK_POOL
  return pool[index % pool.length]
}

// Fetch all active KC experiences with no image_url
const { data, error } = await supabase
  .from('experiences')
  .select('id, title, category')
  .eq('is_active', true)
  .eq('city', 'Kansas City')
  .or('image_url.is.null,image_url.eq.')
  .order('category')

if (error) { console.error('Query failed:', error.message); process.exit(1) }
if (!data?.length) { console.log('All experiences already have images.'); process.exit(0) }

console.log(`Assigning images to ${data.length} experiences…`)

// Group by category so pool rotation varies per category
const byCategory: Record<string, typeof data> = {}
for (const exp of data) {
  const cat = exp.category as string
  if (!byCategory[cat]) byCategory[cat] = []
  byCategory[cat].push(exp)
}

let updated = 0
let failed  = 0

for (const [category, exps] of Object.entries(byCategory)) {
  console.log(`  ${category}: ${exps.length} experiences`)
  for (let i = 0; i < exps.length; i++) {
    const image_url = pickPhoto(category, i)
    const { error: err } = await supabase
      .from('experiences')
      .update({ image_url })
      .eq('id', exps[i].id)
    if (err) { console.warn(`    ✗ ${exps[i].title}`); failed++ }
    else updated++
  }
}

console.log(`\nDone. Updated: ${updated} | Failed: ${failed}`)
console.log('Run scripts/enrichExperiences.ts post-launch to replace with real Google Places photos.')
