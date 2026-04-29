/**
 * DIAGNOSTIC: Experience Card Photos
 *
 * Tests every city+category combo, fallback chains, and URL format.
 * Failures here mean the card will silently show a gradient instead of a real photo.
 */
import { describe, it, expect } from 'vitest'
import {
  PHOTOS,
  FALLBACK_PHOTOS,
  GRADIENTS,
  CATEGORY_STYLES,
  getPhotoUrl,
} from '../components/cards/ExperienceCard'

const KNOWN_CITIES = ['Miami', 'New York City', 'Orlando', 'Las Vegas', 'New Orleans', 'Austin', 'Kansas City']
const KNOWN_CATEGORIES = ['Food & Drink', 'Outdoors', 'Nightlife', 'Sports', 'Arts & Culture', 'Wellness']

// City keys the quiz/edge function uses → what the DB stores
const CITY_KEY_TO_NAME = {
  miami: 'Miami',
  nyc: 'New York City',
  orlando: 'Orlando',
  'las-vegas': 'Las Vegas',
  'new-orleans': 'New Orleans',
  austin: 'Austin',
  'kansas-city': 'Kansas City',
}

// Unsplash photo IDs use either 10-digit (seconds) or 13-digit (ms) Unix timestamps
const VALID_PHOTO_PATTERN = /^https:\/\/images\.unsplash\.com\/photo-\d+-[a-f0-9]+\?w=400&h=300&fit=crop&auto=format&q=80$/

describe('PHOTOS map – completeness', () => {
  it('covers all known cities', () => {
    const coveredCities = Object.keys(PHOTOS)
    const missing = KNOWN_CITIES.filter(c => !coveredCities.includes(c))
    expect(missing, `Cities missing from PHOTOS: ${missing.join(', ')}`).toHaveLength(0)
  })

  it('has no extra/misspelled city keys', () => {
    const unexpected = Object.keys(PHOTOS).filter(c => !KNOWN_CITIES.includes(c))
    expect(unexpected, `Unexpected city keys in PHOTOS: ${unexpected.join(', ')}`).toHaveLength(0)
  })

  it.each(KNOWN_CITIES)('%s – has all 6 categories', (city) => {
    const categories = Object.keys(PHOTOS[city] || {})
    const missing = KNOWN_CATEGORIES.filter(c => !categories.includes(c))
    expect(missing, `${city} missing categories: ${missing.join(', ')}`).toHaveLength(0)
  })

  it('has no duplicate photo IDs within a city (copy-paste check)', () => {
    for (const city of KNOWN_CITIES) {
      const ids = Object.values(PHOTOS[city] || {})
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
      expect(dupes, `${city} has duplicate photo IDs: ${dupes.join(', ')}`).toHaveLength(0)
    }
  })
})

describe('FALLBACK_PHOTOS map – completeness', () => {
  it('has an entry for every category', () => {
    const missing = KNOWN_CATEGORIES.filter(c => !FALLBACK_PHOTOS[c])
    expect(missing, `FALLBACK_PHOTOS missing categories: ${missing.join(', ')}`).toHaveLength(0)
  })
})

describe('getPhotoUrl – URL format', () => {
  it.each(KNOWN_CITIES)('%s – all categories return a valid Unsplash URL', (city) => {
    for (const cat of KNOWN_CATEGORIES) {
      const url = getPhotoUrl(cat, city)
      expect(url, `${city} / ${cat}`).toMatch(VALID_PHOTO_PATTERN)
    }
  })

  it('falls back gracefully for an unknown city', () => {
    const url = getPhotoUrl('Food & Drink', 'Unknown City')
    expect(url).toMatch(VALID_PHOTO_PATTERN)
    // Should use FALLBACK_PHOTOS, not the city-specific photo
    const fallbackId = FALLBACK_PHOTOS['Food & Drink']
    expect(url).toContain(fallbackId)
  })

  it('falls back to default photo for unknown city AND unknown category', () => {
    const url = getPhotoUrl('Extreme Skydiving', 'Atlantis')
    expect(url).toContain('photo-1476514525535-07fb3b4ae5f1')
  })

  it('returns a different URL when city differs (not stuck on fallback)', () => {
    const miamiUrl = getPhotoUrl('Outdoors', 'Miami')
    const nycUrl   = getPhotoUrl('Outdoors', 'New York City')
    expect(miamiUrl).not.toBe(nycUrl)
  })
})

describe('GRADIENTS map – coverage', () => {
  const KNOWN_GRADIENT_KEYS = ['ci-mia', 'ci-nyc', 'ci-orl', 'ci-lv', 'ci-no', 'ci-grn']

  it('has all expected gradient keys', () => {
    const missing = KNOWN_GRADIENT_KEYS.filter(k => !GRADIENTS[k])
    expect(missing, `GRADIENTS missing keys: ${missing.join(', ')}`).toHaveLength(0)
  })

  it('each gradient value contains Tailwind from-/to- classes', () => {
    for (const [key, value] of Object.entries(GRADIENTS)) {
      expect(value, `Gradient "${key}" looks wrong`).toMatch(/from-\[.*\] to-\[.*\]/)
    }
  })
})

describe('CATEGORY_STYLES map – coverage', () => {
  it('has a style for every known category', () => {
    const missing = KNOWN_CATEGORIES.filter(c => !CATEGORY_STYLES[c])
    expect(missing, `CATEGORY_STYLES missing: ${missing.join(', ')}`).toHaveLength(0)
  })
})

describe('City key → DB city name mapping – consistency', () => {
  it('every city key maps to a city that exists in PHOTOS', () => {
    const missing = []
    for (const [key, name] of Object.entries(CITY_KEY_TO_NAME)) {
      if (!PHOTOS[name]) missing.push(`"${key}" → "${name}" not found in PHOTOS`)
    }
    expect(missing, missing.join('\n')).toHaveLength(0)
  })

  it('every city in PHOTOS has a corresponding city key', () => {
    const dbNames = Object.values(CITY_KEY_TO_NAME)
    const orphans = Object.keys(PHOTOS).filter(name => !dbNames.includes(name))
    expect(orphans, `Cities in PHOTOS with no city key: ${orphans.join(', ')}`).toHaveLength(0)
  })
})
