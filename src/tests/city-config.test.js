/**
 * DIAGNOSTIC: City configuration / active city filter
 *
 * Tests that isCityActive() correctly gates cities based on VITE_ACTIVE_CITIES.
 * Failures here mean the wrong cities appear in the quiz or browse page.
 */
import { describe, it, expect } from 'vitest'

const KNOWN_CITIES = [
  'Kansas City',
  'Miami',
  'New York City',
  'Orlando',
  'Las Vegas',
  'New Orleans',
  'Austin',
]

describe('isCityActive — no filter (ACTIVE_CITIES empty)', () => {
  it('returns true for every known city when no filter is set', async () => {
    // Default: import.meta.env.VITE_ACTIVE_CITIES is undefined → all cities active
    const { isCityActive } = await import('../lib/cityConfig')
    for (const city of KNOWN_CITIES) {
      expect(isCityActive(city), `${city} should be active`).toBe(true)
    }
  })
})

describe('CITY_LABELS — edge function / frontend consistency', () => {
  it('CITY_LABELS from frontend lib contains all expected keys', async () => {
    const { CITY_LABELS } = await import('../lib/cities')
    const expectedKeys = ['nyc', 'miami', 'orlando', 'las-vegas', 'new-orleans', 'austin', 'kansas-city']
    for (const key of expectedKeys) {
      expect(CITY_LABELS[key], `Key "${key}" missing from CITY_LABELS`).toBeDefined()
      expect(typeof CITY_LABELS[key]).toBe('string')
      expect(CITY_LABELS[key].trim()).not.toBe('')
    }
  })

  it('every CITY_LABELS value is a proper city name (not a key)', async () => {
    const { CITY_LABELS } = await import('../lib/cities')
    for (const [key, name] of Object.entries(CITY_LABELS)) {
      // The displayed name should not equal the lookup key
      expect(name, `CITY_LABELS["${key}"] should be a display name, not a slug`).not.toBe(key)
    }
  })
})

describe('BUDGET_LABELS — frontend lib', () => {
  it('has entries for all three tiers', async () => {
    const { BUDGET_LABELS } = await import('../lib/cities')
    expect(BUDGET_LABELS['budget']).toBeDefined()
    expect(BUDGET_LABELS['mid']).toBeDefined()
    expect(BUDGET_LABELS['premium']).toBeDefined()
  })

  it('each label contains a dollar sign and /day', async () => {
    const { BUDGET_LABELS } = await import('../lib/cities')
    for (const [tier, label] of Object.entries(BUDGET_LABELS)) {
      expect(label, `Budget tier "${tier}" label should contain "$"`).toContain('$')
      expect(label, `Budget tier "${tier}" label should contain "/day"`).toContain('/day')
    }
  })
})
