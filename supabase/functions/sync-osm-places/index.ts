// supabase/functions/sync-osm-places/index.ts
// Deploy: supabase functions deploy sync-osm-places --no-verify-jwt
//
// Fetches real places from OpenStreetMap Overpass API for a given city
// and upserts them into the experiences table as cached real data.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// City bounding boxes for Overpass API queries
const CITY_BOUNDS: Record<string, { south: number; west: number; north: number; east: number; name: string }> = {
  'New York City': { south: 40.4774, west: -74.2591, north: 40.9176, east: -73.7004, name: 'New York City' },
  'Miami':         { south: 25.6091, west: -80.3788, north: 25.8576, east: -80.1189, name: 'Miami' },
  'Orlando':       { south: 28.3556, west: -81.5789, north: 28.6425, east: -81.1241, name: 'Orlando' },
  'Las Vegas':     { south: 36.0877, west: -115.3814, north: 36.3419, east: -114.9633, name: 'Las Vegas' },
  'New Orleans':   { south: 29.8640, west: -90.1401, north: 30.0710, east: -89.9060, name: 'New Orleans' },
  'Kansas City':   { south: 38.8472, west: -94.7604, north: 39.3394, east: -94.3604, name: 'Kansas City' },
  'Austin':        { south: 30.0986, west: -97.9383, north: 30.5170, east: -97.5683, name: 'Austin' },
}

// OSM tags mapped to vtopia categories
const CATEGORY_QUERIES: Array<{
  category: string
  emoji: string
  gradient: string
  filters: string[]
  maxGuests: number
  priceRange: [number, number]
  durationLabel: string
}> = [
  {
    category: 'Food & Drink',
    emoji: '🍽️',
    gradient: 'ci-mia',
    filters: [
      'node["amenity"~"restaurant|cafe|bar|food_court|fast_food"]',
      'way["amenity"~"restaurant|cafe|bar|food_court"]',
    ],
    maxGuests: 8,
    priceRange: [20, 85],
    durationLabel: '1-2 hrs',
  },
  {
    category: 'Nightlife',
    emoji: '🌙',
    gradient: 'ci-lv',
    filters: [
      'node["amenity"~"nightclub|bar|pub|lounge"]',
      'way["amenity"~"nightclub|bar|pub"]',
    ],
    maxGuests: 10,
    priceRange: [25, 75],
    durationLabel: '3-4 hrs',
  },
  {
    category: 'Outdoors',
    emoji: '🌿',
    gradient: 'ci-grn',
    filters: [
      'node["leisure"~"park|nature_reserve|garden|playground"]',
      'way["leisure"~"park|nature_reserve|garden"]',
      'node["natural"~"beach|bay|water"]',
      'way["natural"~"beach|bay"]',
    ],
    maxGuests: 20,
    priceRange: [0, 45],
    durationLabel: '2-4 hrs',
  },
  {
    category: 'Arts & Culture',
    emoji: '🎨',
    gradient: 'ci-nyc',
    filters: [
      'node["tourism"~"museum|gallery|attraction|artwork"]',
      'way["tourism"~"museum|gallery|attraction"]',
      'node["amenity"~"theatre|cinema|arts_centre"]',
      'way["amenity"~"theatre|arts_centre"]',
    ],
    maxGuests: 15,
    priceRange: [15, 60],
    durationLabel: '2-3 hrs',
  },
  {
    category: 'Wellness',
    emoji: '🧘',
    gradient: 'ci-no',
    filters: [
      'node["leisure"~"spa|fitness_centre|yoga|swimming_pool"]',
      'way["leisure"~"spa|fitness_centre|swimming_pool"]',
      'node["amenity"~"spa"]',
    ],
    maxGuests: 6,
    priceRange: [35, 120],
    durationLabel: '1-2 hrs',
  },
  {
    category: 'Sports',
    emoji: '🏟️',
    gradient: 'ci-orl',
    filters: [
      'node["leisure"~"sports_centre|stadium|pitch|golf_course"]',
      'way["leisure"~"sports_centre|stadium|pitch|golf_course"]',
      'node["sport"~"tennis|basketball|baseball|soccer|golf"]',
    ],
    maxGuests: 20,
    priceRange: [20, 100],
    durationLabel: '2-3 hrs',
  },
]

function buildOverpassQuery(bounds: { south: number; west: number; north: number; east: number }, filters: string[], limit = 15): string {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
  const parts = filters.map(f => `${f}(${bbox});`).join('\n')
  return `[out:json][timeout:25];
(
${parts}
);
out body ${limit};`
}

function randomInRange(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function generateRating(): number {
  return Math.round((3.5 + Math.random() * 1.5) * 10) / 10
}

function generateReviewCount(): number {
  return Math.floor(Math.random() * 800 + 50)
}

// Extract a clean name and address from OSM tags
function extractNameAndAddress(tags: Record<string, string>, defaultCity: string): { title: string; address: string; description: string } {
  const name = tags.name || tags['name:en'] || ''
  if (!name) return { title: '', address: '', description: '' }

  const street = tags['addr:street'] || ''
  const housenumber = tags['addr:housenumber'] || ''
  const address = [housenumber, street, defaultCity].filter(Boolean).join(', ')

  const cuisine = tags.cuisine ? `Cuisine: ${tags.cuisine.replace(/_/g, ' ')}. ` : ''
  const opening = tags.opening_hours ? `Hours: ${tags.opening_hours}. ` : ''
  const description = `${cuisine}${opening}A local spot in ${defaultCity}.`.trim()

  return { title: name, address, description }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { city, category, forceRefresh = false } = await req.json()

    if (!city || !CITY_BOUNDS[city]) {
      return new Response(
        JSON.stringify({ error: `Unknown city: ${city}. Valid cities: ${Object.keys(CITY_BOUNDS).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const bounds = CITY_BOUNDS[city]

    // Check cache — if we already have OSM data for this city+category, skip re-fetch
    if (!forceRefresh) {
      const { count } = await supabase
        .from('experiences')
        .select('*', { count: 'exact', head: true })
        .eq('city', city)
        .eq('source', 'osm')
        .eq('is_active', true)
        .eq('category', category || 'Food & Drink')

      if ((count ?? 0) >= 5) {
        return new Response(
          JSON.stringify({ message: 'Cache hit — using existing data', count }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const categoriesToSync = category
      ? CATEGORY_QUERIES.filter(c => c.category === category)
      : CATEGORY_QUERIES

    let totalInserted = 0
    const errors: string[] = []

    for (const cat of categoriesToSync) {
      try {
        const query = buildOverpassQuery(bounds, cat.filters, 20)

        const osmRes = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        })

        if (!osmRes.ok) {
          errors.push(`OSM fetch failed for ${cat.category}: ${osmRes.status}`)
          continue
        }

        const osmData = await osmRes.json()
        const elements = osmData.elements ?? []

        const toInsert = []

        for (const el of elements) {
          const tags = el.tags ?? {}
          const { title, address, description } = extractNameAndAddress(tags, city)

          if (!title) continue

          // Get lat/lng from node or way centroid
          const lat = el.lat ?? el.center?.lat
          const lng = el.lon ?? el.center?.lon

          toInsert.push({
            title,
            description: description || `A great ${cat.category.toLowerCase()} experience in ${city}.`,
            city,
            category: cat.category,
            price_per_person: randomInRange(cat.priceRange[0], cat.priceRange[1]),
            duration_label: cat.durationLabel,
            max_guests: cat.maxGuests,
            image_emoji: cat.emoji,
            image_gradient: cat.gradient,
            rating: generateRating(),
            review_count: generateReviewCount(),
            is_active: true,
            is_featured: false,
            is_sponsored: false,
            source: 'osm',
            osm_id: String(el.id),
            osm_type: el.type,
            lat: lat ?? null,
            lng: lng ?? null,
            address: address || null,
            website: tags.website || tags['contact:website'] || null,
            phone: tags.phone || tags['contact:phone'] || null,
            tags: Object.entries(tags)
              .filter(([k]) => ['cuisine', 'sport', 'leisure', 'tourism'].includes(k))
              .map(([k, v]) => `${k}:${v}`)
              .slice(0, 5),
          })
        }

        if (toInsert.length > 0) {
          // Upsert — skip if osm_id already exists
          const { error: upsertErr, count: inserted } = await supabase
            .from('experiences')
            .upsert(toInsert, {
              onConflict: 'osm_id',
              ignoreDuplicates: true,
            })
            .select('id', { count: 'exact' })

          if (upsertErr) {
            errors.push(`Insert error for ${cat.category}: ${upsertErr.message}`)
          } else {
            totalInserted += inserted ?? toInsert.length
          }
        }

      } catch (catErr) {
        errors.push(`Error syncing ${cat.category}: ${catErr.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        city,
        totalInserted,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
