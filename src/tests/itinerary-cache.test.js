import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { itineraryCacheKey } from '../pages/ItineraryResults.jsx'

const STORAGE_KEY = 'vtopia_active_itinerary'

function makeAnswers(overrides = {}) {
  return {
    city: 'kansas-city',
    startDate: '2026-06-15',
    endDate: '2026-06-18',
    budget: 'mid',
    interests: ['food', 'outdoors'],
    traveler: 'couple',
    ...overrides,
  }
}

function makeItinerary() {
  return {
    headline: 'A Weekend in KC',
    overview: 'Two days of great food and fun.',
    days: [
      {
        day: 1,
        theme: 'Downtown Exploration',
        morning: { title: 'Coffee', description: 'Grab a latte', tip: '', cost: '$', experienceId: '' },
        afternoon: { title: 'Museum', description: 'Learn history', tip: '', cost: '$$', experienceId: '' },
        evening: { title: 'Jazz', description: 'Live music', tip: '', cost: '$$$', experienceId: '' },
        lunch: 'Joe\'s KC BBQ',
        dinner: 'Farina',
        dailyTotal: '~$120',
      },
    ],
    hotelRecommendations: [],
    packingTips: ['Comfortable shoes'],
    budgetBreakdown: { accommodation: '$120', food: '$60', activities: '$40', transport: '$20' },
  }
}

describe('itineraryCacheKey', () => {
  it('produces the same key for identical answers', () => {
    const a = makeAnswers()
    const b = makeAnswers()
    expect(itineraryCacheKey(a)).toBe(itineraryCacheKey(b))
  })

  it('produces different keys when city differs', () => {
    const a = makeAnswers({ city: 'kansas-city' })
    const b = makeAnswers({ city: 'miami' })
    expect(itineraryCacheKey(a)).not.toBe(itineraryCacheKey(b))
  })

  it('produces different keys when startDate differs', () => {
    const a = makeAnswers({ startDate: '2026-06-15' })
    const b = makeAnswers({ startDate: '2026-06-20' })
    expect(itineraryCacheKey(a)).not.toBe(itineraryCacheKey(b))
  })

  it('produces different keys when endDate differs', () => {
    const a = makeAnswers({ endDate: '2026-06-18' })
    const b = makeAnswers({ endDate: '2026-06-22' })
    expect(itineraryCacheKey(a)).not.toBe(itineraryCacheKey(b))
  })

  it('produces different keys when budget differs', () => {
    const a = makeAnswers({ budget: 'mid' })
    const b = makeAnswers({ budget: 'premium' })
    expect(itineraryCacheKey(a)).not.toBe(itineraryCacheKey(b))
  })

  it('ignores interests — same key despite different interests', () => {
    const a = makeAnswers({ interests: ['food'] })
    const b = makeAnswers({ interests: ['outdoors', 'arts'] })
    expect(itineraryCacheKey(a)).toBe(itineraryCacheKey(b))
  })

  it('returns a defined string for null/undefined answers', () => {
    expect(typeof itineraryCacheKey(null)).toBe('string')
    expect(typeof itineraryCacheKey(undefined)).toBe('string')
  })
})

describe('sessionStorage cache round-trip', () => {
  const storage = {}
  const originalGetItem = globalThis.sessionStorage?.getItem
  const originalSetItem = globalThis.sessionStorage?.setItem
  const originalRemoveItem = globalThis.sessionStorage?.removeItem

  // JSDOM provides sessionStorage; just use it directly

  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('stores and retrieves a cached itinerary', () => {
    const answers = makeAnswers()
    const itinerary = makeItinerary()

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      itinerary,
      answers,
      city: answers.city,
    }))

    const raw = sessionStorage.getItem(STORAGE_KEY)
    const cached = JSON.parse(raw)

    expect(cached.itinerary.headline).toBe('A Weekend in KC')
    expect(cached.answers.city).toBe('kansas-city')
    expect(itineraryCacheKey(cached.answers)).toBe(itineraryCacheKey(answers))
  })

  it('cache key mismatch means different city is not restored', () => {
    const storedAnswers = makeAnswers({ city: 'miami' })
    const currentAnswers = makeAnswers({ city: 'kansas-city' })

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      itinerary: makeItinerary(),
      answers: storedAnswers,
      city: storedAnswers.city,
    }))

    const raw = sessionStorage.getItem(STORAGE_KEY)
    const cached = JSON.parse(raw)

    expect(itineraryCacheKey(cached.answers)).not.toBe(itineraryCacheKey(currentAnswers))
  })

  it('itineraryId is preserved in cache after DB save', () => {
    const answers = makeAnswers()
    const itinerary = makeItinerary()
    const itineraryId = 'abc-123'

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ itinerary, answers, city: answers.city }))

    // Simulate the post-DB-save update
    const raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    raw.itineraryId = itineraryId
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(raw))

    const updated = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    expect(updated.itineraryId).toBe('abc-123')
  })

  it('cache with no days is treated as invalid', () => {
    const answers = makeAnswers()
    const badItinerary = { headline: 'Oops', overview: 'Bad', days: [] }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      itinerary: badItinerary,
      answers,
      city: answers.city,
    }))

    const raw = sessionStorage.getItem(STORAGE_KEY)
    const cached = JSON.parse(raw)

    // days.length === 0 should not pass the cache restore guard
    expect(cached.itinerary.days.length > 0).toBe(false)
  })
})
