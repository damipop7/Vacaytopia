/**
 * DIAGNOSTIC: AI Itinerary – Response Structure Validator
 *
 * Validates that a parsed Claude response has all required fields.
 * Use this to diagnose partial/malformed responses from the edge function.
 * Pass a real response into `validateItinerary()` to see exactly what's missing.
 */
import { describe, it, expect } from 'vitest'

function validateItinerary(obj) {
  const errors = []

  if (!obj || typeof obj !== 'object') {
    return ['Response is not an object']
  }

  if (!obj.headline || typeof obj.headline !== 'string' || obj.headline.trim() === '')
    errors.push('Missing or empty: headline')

  if (!obj.overview || typeof obj.overview !== 'string' || obj.overview.trim() === '')
    errors.push('Missing or empty: overview')

  if (!Array.isArray(obj.days) || obj.days.length === 0)
    errors.push('Missing or empty: days array')

  obj.days?.forEach((day, i) => {
    const prefix = `days[${i}]`
    if (!Number.isInteger(day.day))    errors.push(`${prefix}.day must be an integer`)
    if (!day.theme)                    errors.push(`${prefix}.theme is missing`)
    if (!day.morning)                  errors.push(`${prefix}.morning block is missing`)
    if (!day.afternoon)                errors.push(`${prefix}.afternoon block is missing`)
    if (!day.evening)                  errors.push(`${prefix}.evening block is missing`)
    if (!day.lunch)                    errors.push(`${prefix}.lunch is missing`)
    if (!day.dinner)                   errors.push(`${prefix}.dinner is missing`)

    for (const period of ['morning', 'afternoon', 'evening']) {
      const slot = day[period]
      if (!slot) continue
      if (!slot.title)       errors.push(`${prefix}.${period}.title is missing`)
      if (!slot.description) errors.push(`${prefix}.${period}.description is missing`)
    }
  })

  if (!Array.isArray(obj.hotelRecommendations) || obj.hotelRecommendations.length === 0)
    errors.push('Missing or empty: hotelRecommendations')

  obj.hotelRecommendations?.forEach((h, i) => {
    if (!h.name)       errors.push(`hotelRecommendations[${i}].name is missing`)
    if (!h.reason)     errors.push(`hotelRecommendations[${i}].reason is missing`)
    if (!h.priceRange) errors.push(`hotelRecommendations[${i}].priceRange is missing`)
  })

  if (!Array.isArray(obj.packingTips) || obj.packingTips.length === 0)
    errors.push('Missing or empty: packingTips')

  if (!obj.budgetBreakdown || typeof obj.budgetBreakdown !== 'object')
    errors.push('Missing: budgetBreakdown')
  else {
    for (const key of ['accommodation', 'food', 'activities', 'transport']) {
      if (!obj.budgetBreakdown[key])
        errors.push(`budgetBreakdown.${key} is missing`)
    }
  }

  return errors
}

const GOOD_ITINERARY = {
  headline: 'Four Days of Sun and Salsa',
  overview: 'Explore Miami beach, food, and nightlife. Perfect for a couple on a mid budget.',
  days: [
    {
      day: 1,
      theme: 'Arrival & South Beach',
      morning: { title: 'Check in', description: 'Head to the hotel.', tip: 'Book early.', cost: '$0', experienceId: '' },
      afternoon: { title: 'Beach time', description: 'Hit South Beach.', tip: 'Sunscreen!', cost: '$10', experienceId: '' },
      evening: { title: 'Sunset walk', description: 'Walk the boardwalk.', tip: 'Wear comfy shoes.', cost: '$0', experienceId: '' },
      lunch: 'Joe\'s Stone Crab — iconic Miami seafood',
      dinner: 'Versailles — Cuban cuisine in Little Havana',
      dailyTotal: '$180',
    },
  ],
  hotelRecommendations: [
    { name: 'The Betsy', reason: 'Boutique hotel steps from the beach.', priceRange: '$$$' },
  ],
  packingTips: ['Sunscreen', 'Light layers', 'Reef-safe sunscreen'],
  budgetBreakdown: {
    accommodation: '$150/night',
    food: '$60/day',
    activities: '$50/day',
    transport: '$20/day',
  },
}

describe('validateItinerary – passes a well-formed response', () => {
  it('returns no errors for a valid itinerary', () => {
    const errors = validateItinerary(GOOD_ITINERARY)
    expect(errors, `Unexpected errors:\n${errors.join('\n')}`).toHaveLength(0)
  })
})

describe('validateItinerary – catches missing top-level fields', () => {
  it('catches missing headline', () => {
    const { headline: _, ...bad } = GOOD_ITINERARY
    expect(validateItinerary(bad)).toContain('Missing or empty: headline')
  })

  it('catches missing overview', () => {
    const { overview: _, ...bad } = GOOD_ITINERARY
    expect(validateItinerary(bad)).toContain('Missing or empty: overview')
  })

  it('catches missing days array', () => {
    const { days: _, ...bad } = GOOD_ITINERARY
    expect(validateItinerary(bad)).toContain('Missing or empty: days array')
  })

  it('catches missing hotelRecommendations', () => {
    const { hotelRecommendations: _, ...bad } = GOOD_ITINERARY
    expect(validateItinerary(bad)).toContain('Missing or empty: hotelRecommendations')
  })

  it('catches missing budgetBreakdown', () => {
    const { budgetBreakdown: _, ...bad } = GOOD_ITINERARY
    expect(validateItinerary(bad)).toContain('Missing: budgetBreakdown')
  })

  it('catches missing packingTips', () => {
    const { packingTips: _, ...bad } = GOOD_ITINERARY
    expect(validateItinerary(bad)).toContain('Missing or empty: packingTips')
  })
})

describe('validateItinerary – catches malformed day blocks', () => {
  function badDay(overrides) {
    return {
      ...GOOD_ITINERARY,
      days: [{ ...GOOD_ITINERARY.days[0], ...overrides }],
    }
  }

  it('catches missing morning block', () => {
    const errors = validateItinerary(badDay({ morning: null }))
    expect(errors).toContain('days[0].morning block is missing')
  })

  it('catches missing afternoon block', () => {
    const errors = validateItinerary(badDay({ afternoon: null }))
    expect(errors).toContain('days[0].afternoon block is missing')
  })

  it('catches missing evening block', () => {
    const errors = validateItinerary(badDay({ evening: null }))
    expect(errors).toContain('days[0].evening block is missing')
  })

  it('catches missing title inside morning', () => {
    const errors = validateItinerary(badDay({
      morning: { ...GOOD_ITINERARY.days[0].morning, title: '' }
    }))
    expect(errors).toContain('days[0].morning.title is missing')
  })

  it('catches missing lunch', () => {
    const errors = validateItinerary(badDay({ lunch: '' }))
    expect(errors).toContain('days[0].lunch is missing')
  })
})

describe('validateItinerary – catches partial budgetBreakdown', () => {
  it('catches missing transport key', () => {
    const { transport: _, ...breakdown } = GOOD_ITINERARY.budgetBreakdown
    const errors = validateItinerary({ ...GOOD_ITINERARY, budgetBreakdown: breakdown })
    expect(errors).toContain('budgetBreakdown.transport is missing')
  })

  it('catches missing food key', () => {
    const { food: _, ...breakdown } = GOOD_ITINERARY.budgetBreakdown
    const errors = validateItinerary({ ...GOOD_ITINERARY, budgetBreakdown: breakdown })
    expect(errors).toContain('budgetBreakdown.food is missing')
  })
})

describe('validateItinerary – edge cases', () => {
  it('returns error for null input', () => {
    expect(validateItinerary(null)).toContain('Response is not an object')
  })

  it('returns error for a plain string (unparsed JSON)', () => {
    expect(validateItinerary('{"headline":"test"}')).toContain('Response is not an object')
  })

  it('passes with multiple days (verifies per-day checks)', () => {
    const multiDay = {
      ...GOOD_ITINERARY,
      days: [
        GOOD_ITINERARY.days[0],
        { ...GOOD_ITINERARY.days[0], day: 2, theme: 'Explore Wynwood' },
        { ...GOOD_ITINERARY.days[0], day: 3, theme: 'Day Trip to Keys' },
      ],
    }
    const errors = validateItinerary(multiDay)
    expect(errors, errors.join('\n')).toHaveLength(0)
  })
})
