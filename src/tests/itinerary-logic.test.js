/**
 * DIAGNOSTIC: AI Itinerary – Logic & Mappings
 *
 * Tests the city/budget/traveler mappings, date math, and prompt construction
 * that the edge function relies on. Failures here mean Claude gets wrong context.
 */
import { describe, it, expect } from 'vitest'
import { CITY_LABELS as FRONTEND_CITY_LABELS, BUDGET_LABELS as FRONTEND_BUDGET_LABELS } from '../lib/cities'

// Replicated from supabase/functions/generate-itinerary/index.ts
// Tests catch drift between the edge function copy and the shared frontend module.
const EDGE_CITY_LABELS = {
  nyc: 'New York City',
  miami: 'Miami',
  orlando: 'Orlando',
  'las-vegas': 'Las Vegas',
  'new-orleans': 'New Orleans',
  austin: 'Austin',
  'kansas-city': 'Kansas City',
}

const EDGE_BUDGET_LABELS = {
  budget: '$100-200/day',
  mid: '$200-350/day',
  premium: '$350-500/day',
}

const EDGE_HOTEL_TIER = {
  budget: 'budget-friendly hostels and guesthouses',
  mid: '3-4 star hotels and boutique stays',
  premium: 'boutique hotels and luxury properties',
}

function buildPrompt(answers, experiences = []) {
  const city = EDGE_CITY_LABELS[answers.city] || answers.city
  const nights = Math.round(
    (new Date(answers.endDate).getTime() - new Date(answers.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )
  const days = nights + 1
  const extras = answers.extras ? `\nExtra context: ${answers.extras}` : ''

  const catalogSection = experiences.length > 0
    ? `\n\nReal bookable experiences on Vtopia for ${city}:\n${
        experiences.map(e => `[${e.id}] ${e.title} | ${e.category} | $${e.price_per_person}/person | ${e.duration_label}`).join('\n')
      }\n\nWhen an activity slot fits one of the above experiences: include "experienceId" set to its UUID and set "cost" to its exact price (e.g. "$${experiences[0]?.price_per_person}/person"). For slots with no matching Vtopia experience, omit "experienceId".`
    : ''

  return `You are a travel concierge. Create a ${days}-day itinerary for a ${answers.traveler} trip to ${city}. Budget: ${EDGE_BUDGET_LABELS[answers.budget]} per person/day. Interests: ${answers.interests.join(', ')}. Hotel tier: ${EDGE_HOTEL_TIER[answers.budget]}.${extras}${catalogSection}

Keep all descriptions to 1-2 sentences max. Respond ONLY with this JSON structure, no markdown:

{"headline":"6-8 word tagline","overview":"2 sentence overview","days":[{"day":1,"theme":"Day theme","morning":{"title":"","description":"","tip":"","cost":"","experienceId":""},"afternoon":{"title":"","description":"","tip":"","cost":"","experienceId":""},"evening":{"title":"","description":"","tip":"","cost":"","experienceId":""},"lunch":"Restaurant and why","dinner":"Restaurant and why","dailyTotal":"Est total"}],"hotelRecommendations":[{"name":"","reason":"","priceRange":"$/$$/$$$"}],"packingTips":["tip1","tip2","tip3"],"budgetBreakdown":{"accommodation":"","food":"","activities":"","transport":""}}`
}

const BASE_ANSWERS = {
  city: 'miami',
  startDate: '2025-07-01',
  endDate: '2025-07-04',
  budget: 'mid',
  traveler: 'couple',
  interests: ['food', 'outdoors'],
  extras: '',
}

describe('City mappings – frontend vs edge function consistency', () => {
  it('both use identical CITY_LABELS keys', () => {
    expect(Object.keys(EDGE_CITY_LABELS).sort()).toEqual(Object.keys(FRONTEND_CITY_LABELS).sort())
  })

  it('both map every key to the same city name', () => {
    for (const key of Object.keys(EDGE_CITY_LABELS)) {
      expect(EDGE_CITY_LABELS[key], `Key "${key}" mismatch`).toBe(FRONTEND_CITY_LABELS[key])
    }
  })
})

describe('Budget mappings – frontend vs edge function consistency', () => {
  it('both use identical budget label keys', () => {
    expect(Object.keys(EDGE_BUDGET_LABELS).sort()).toEqual(Object.keys(FRONTEND_BUDGET_LABELS).sort())
  })

  it('both map every key to the same label', () => {
    for (const key of Object.keys(EDGE_BUDGET_LABELS)) {
      expect(EDGE_BUDGET_LABELS[key], `Budget "${key}" mismatch`).toBe(FRONTEND_BUDGET_LABELS[key])
    }
  })
})

describe('buildPrompt – day count calculation', () => {
  it('3 nights = 4 days', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, startDate: '2025-07-01', endDate: '2025-07-04' })
    expect(p).toContain('4-day itinerary')
  })

  it('1 night = 2 days', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, startDate: '2025-07-01', endDate: '2025-07-02' })
    expect(p).toContain('2-day itinerary')
  })

  it('same day (0 nights) = 1 day', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, startDate: '2025-07-01', endDate: '2025-07-01' })
    expect(p).toContain('1-day itinerary')
  })

  it('7 nights = 8 days', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, startDate: '2025-07-01', endDate: '2025-07-08' })
    expect(p).toContain('8-day itinerary')
  })
})

describe('buildPrompt – city resolution', () => {
  it('resolves "miami" key to "Miami"', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, city: 'miami' })
    expect(p).toContain('trip to Miami')
  })

  it('resolves "nyc" to "New York City"', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, city: 'nyc' })
    expect(p).toContain('trip to New York City')
  })

  it('resolves "las-vegas" to "Las Vegas"', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, city: 'las-vegas' })
    expect(p).toContain('trip to Las Vegas')
  })

  it('falls back to raw city string for unknown key', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, city: 'phoenix' })
    expect(p).toContain('trip to phoenix')
  })
})

describe('buildPrompt – extras field', () => {
  it('omits "Extra context" line when extras is empty', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, extras: '' })
    expect(p).not.toContain('Extra context')
  })

  it('includes extras text when provided', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, extras: 'We have a dog and need pet-friendly spots' })
    expect(p).toContain('Extra context: We have a dog')
  })
})

describe('buildPrompt – experience catalog injection', () => {
  const MOCK_EXPERIENCES = [
    { id: 'uuid-001', title: 'Miami Food Tour', category: 'Food & Drink', price_per_person: 89, duration_label: '3 hrs' },
    { id: 'uuid-002', title: 'South Beach Kayak', category: 'Outdoors', price_per_person: 65, duration_label: '2 hrs' },
  ]

  it('includes catalog section when experiences are provided', () => {
    const p = buildPrompt(BASE_ANSWERS, MOCK_EXPERIENCES)
    expect(p).toContain('Real bookable experiences on Vtopia')
    expect(p).toContain('[uuid-001] Miami Food Tour | Food & Drink | $89/person | 3 hrs')
    expect(p).toContain('[uuid-002] South Beach Kayak | Outdoors | $65/person | 2 hrs')
  })

  it('omits catalog section when no experiences', () => {
    const p = buildPrompt(BASE_ANSWERS, [])
    expect(p).not.toContain('Real bookable experiences on Vtopia')
  })

  it('catalog lists price correctly', () => {
    const p = buildPrompt(BASE_ANSWERS, MOCK_EXPERIENCES)
    expect(p).toContain('$89/person')
    expect(p).toContain('$65/person')
  })
})

describe('buildPrompt – budget labels', () => {
  it('uses correct label for "budget" tier', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, budget: 'budget' })
    expect(p).toContain('$100-200/day')
    expect(p).toContain('budget-friendly hostels')
  })

  it('uses correct label for "mid" tier', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, budget: 'mid' })
    expect(p).toContain('$200-350/day')
    expect(p).toContain('3-4 star hotels')
  })

  it('uses correct label for "premium" tier', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, budget: 'premium' })
    expect(p).toContain('$350-500/day')
    expect(p).toContain('boutique hotels and luxury')
  })
})

describe('buildPrompt – interests', () => {
  it('joins multiple interests with comma+space', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, interests: ['food', 'outdoors', 'nightlife'] })
    expect(p).toContain('Interests: food, outdoors, nightlife')
  })

  it('handles single interest', () => {
    const p = buildPrompt({ ...BASE_ANSWERS, interests: ['wellness'] })
    expect(p).toContain('Interests: wellness')
  })
})
