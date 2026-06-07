import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readStoredQuizAnswers, blurbCacheKey } from '../hooks/usePersonalizedBlurb'

// ── readStoredQuizAnswers ─────────────────────────────────────────────────────

describe('readStoredQuizAnswers', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => sessionStorage.clear())

  it('returns null when sessionStorage is empty', () => {
    expect(readStoredQuizAnswers()).toBeNull()
  })

  it('returns null for corrupt JSON', () => {
    sessionStorage.setItem('vtopia_active_itinerary', 'not-json{{{')
    expect(readStoredQuizAnswers()).toBeNull()
  })

  it('returns null when answers key is missing', () => {
    sessionStorage.setItem('vtopia_active_itinerary', JSON.stringify({ itinerary: {} }))
    expect(readStoredQuizAnswers()).toBeNull()
  })

  it('returns the answers object when present', () => {
    const answers = { city: 'kansas-city', budget: 'mid', traveler: 'friends' }
    sessionStorage.setItem('vtopia_active_itinerary', JSON.stringify({ answers }))
    expect(readStoredQuizAnswers()).toEqual(answers)
  })

  it('returns null when answers is explicitly null in storage', () => {
    sessionStorage.setItem('vtopia_active_itinerary', JSON.stringify({ answers: null }))
    expect(readStoredQuizAnswers()).toBeNull()
  })
})

// ── blurbCacheKey ─────────────────────────────────────────────────────────────

describe('blurbCacheKey', () => {
  it('returns null when expId is missing', () => {
    expect(blurbCacheKey(null, { budget: 'mid', traveler: 'solo' })).toBeNull()
    expect(blurbCacheKey(undefined, { budget: 'mid' })).toBeNull()
  })

  it('returns null when answers are missing', () => {
    expect(blurbCacheKey('exp-1', null)).toBeNull()
    expect(blurbCacheKey('exp-1', undefined)).toBeNull()
  })

  it('includes expId, budget, and traveler in the key', () => {
    const key = blurbCacheKey('exp-abc', { budget: 'premium', traveler: 'couple' })
    expect(key).toContain('exp-abc')
    expect(key).toContain('premium')
    expect(key).toContain('couple')
  })

  it('produces different keys for different budgets', () => {
    const k1 = blurbCacheKey('exp-1', { budget: 'budget', traveler: 'solo' })
    const k2 = blurbCacheKey('exp-1', { budget: 'premium', traveler: 'solo' })
    expect(k1).not.toBe(k2)
  })

  it('produces different keys for different traveler types', () => {
    const k1 = blurbCacheKey('exp-1', { budget: 'mid', traveler: 'solo' })
    const k2 = blurbCacheKey('exp-1', { budget: 'mid', traveler: 'family' })
    expect(k1).not.toBe(k2)
  })

  it('produces different keys for different experience IDs', () => {
    const answers = { budget: 'mid', traveler: 'friends' }
    const k1 = blurbCacheKey('exp-1', answers)
    const k2 = blurbCacheKey('exp-2', answers)
    expect(k1).not.toBe(k2)
  })

  it('produces the same key for the same inputs (stable)', () => {
    const answers = { budget: 'mid', traveler: 'friends' }
    expect(blurbCacheKey('exp-1', answers)).toBe(blurbCacheKey('exp-1', answers))
  })

  it('falls back to "mid" budget when budget is absent', () => {
    const key = blurbCacheKey('exp-1', { traveler: 'solo' })
    expect(key).toContain('mid')
  })

  it('falls back to "solo" traveler when traveler is absent', () => {
    const key = blurbCacheKey('exp-1', { budget: 'mid' })
    expect(key).toContain('solo')
  })
})
