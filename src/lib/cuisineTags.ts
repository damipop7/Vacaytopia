/**
 * Derives a `cuisine:<word>` tag (same convention as the existing OSM
 * `cuisine:burger`-style tags already in the `tags` column) from Google
 * Places (New) `types`. Used to backfill cuisine data via the Google
 * Places enrichment pipeline, since OSM only covers ~14% of KC food listings.
 */

const GENERIC_TYPES = new Set([
  'restaurant', 'food', 'point_of_interest', 'establishment',
  'meal_takeaway', 'meal_delivery', 'store',
])

const SUFFIX_STRIP = [/_restaurant$/, /_house$/, /_shop$/, /_bar$/]

// Food-specific types with no _restaurant/_bar/_shop/_house suffix to strip —
// need an explicit allowlist so non-food types (e.g. "night_club", "parking") aren't tagged.
const STANDALONE_FOOD_TYPES = new Set([
  'cafe', 'bakery', 'pub', 'diner', 'bistro', 'deli', 'brewery', 'winery', 'distillery', 'buffet',
])

export function deriveCuisineTag(types: string[] | null | undefined): string | null {
  if (!types?.length) return null

  for (const type of types) {
    if (GENERIC_TYPES.has(type)) continue

    let word = type
    for (const pattern of SUFFIX_STRIP) {
      if (pattern.test(word)) { word = word.replace(pattern, ''); break }
    }

    const suffixStripped = word !== type
    if (!suffixStripped && !STANDALONE_FOOD_TYPES.has(type)) continue
    if (!word) continue

    return `cuisine:${word}`
  }
  return null
}

/** Merge a derived cuisine tag into existing tags without duplicating or clobbering a prior source's tag. */
export function mergeCuisineTag(existingTags: string[] | null | undefined, cuisineTag: string | null): string[] {
  const tags = existingTags ? [...existingTags] : []
  if (!cuisineTag) return tags
  if (tags.some(t => t.startsWith('cuisine:'))) return tags
  return [...tags, cuisineTag]
}
