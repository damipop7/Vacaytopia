/**
 * Tests for review submission logic.
 *
 * Pure unit tests — no Supabase calls. Validates the data shape and
 * validation rules that the InlineReviewForm enforces before inserting.
 */
import { describe, it, expect } from 'vitest'

// ── Pure validation helpers (mirror the logic in ProfilePage) ─────────────────

/**
 * Validates a review object before it is sent to the database.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
function validateReview({ booking_id, user_id, experience_id, rating, body = '' }) {
  if (!booking_id)    return { valid: false, reason: 'booking_id is required' }
  if (!user_id)       return { valid: false, reason: 'user_id is required' }
  if (!experience_id) return { valid: false, reason: 'experience_id is required' }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { valid: false, reason: 'rating must be an integer between 1 and 5' }
  }
  // body is optional — empty string is fine
  if (typeof body !== 'string') return { valid: false, reason: 'body must be a string' }
  return { valid: true }
}

// ── Review object validation ───────────────────────────────────────────────────

describe('validateReview — required fields', () => {
  it('returns valid for a complete review object', () => {
    const result = validateReview({
      booking_id:    'bk-1',
      user_id:       'u-1',
      experience_id: 'exp-1',
      rating:        4,
      body:          'Great time!',
    })
    expect(result.valid).toBe(true)
  })

  it('is invalid when booking_id is missing', () => {
    const result = validateReview({ user_id: 'u-1', experience_id: 'exp-1', rating: 3 })
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/booking_id/)
  })

  it('is invalid when user_id is missing', () => {
    const result = validateReview({ booking_id: 'bk-1', experience_id: 'exp-1', rating: 3 })
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/user_id/)
  })

  it('is invalid when experience_id is missing', () => {
    const result = validateReview({ booking_id: 'bk-1', user_id: 'u-1', rating: 3 })
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/experience_id/)
  })
})

describe('validateReview — rating validation', () => {
  it('is valid for rating 1 (minimum)', () => {
    expect(validateReview({ booking_id:'bk', user_id:'u', experience_id:'e', rating: 1 }).valid).toBe(true)
  })

  it('is valid for rating 5 (maximum)', () => {
    expect(validateReview({ booking_id:'bk', user_id:'u', experience_id:'e', rating: 5 }).valid).toBe(true)
  })

  it('is valid for rating 3 (midpoint)', () => {
    expect(validateReview({ booking_id:'bk', user_id:'u', experience_id:'e', rating: 3 }).valid).toBe(true)
  })

  it('is invalid for rating 0', () => {
    const result = validateReview({ booking_id:'bk', user_id:'u', experience_id:'e', rating: 0 })
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/rating/)
  })

  it('is invalid for rating 6', () => {
    const result = validateReview({ booking_id:'bk', user_id:'u', experience_id:'e', rating: 6 })
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/rating/)
  })

  it('is invalid for a negative rating', () => {
    const result = validateReview({ booking_id:'bk', user_id:'u', experience_id:'e', rating: -1 })
    expect(result.valid).toBe(false)
  })

  it('is invalid for a float rating (4.5)', () => {
    const result = validateReview({ booking_id:'bk', user_id:'u', experience_id:'e', rating: 4.5 })
    expect(result.valid).toBe(false)
  })
})

describe('validateReview — body is optional', () => {
  it('is valid when body is an empty string', () => {
    expect(validateReview({ booking_id:'bk', user_id:'u', experience_id:'e', rating: 5, body: '' }).valid).toBe(true)
  })

  it('is valid when body is omitted entirely', () => {
    expect(validateReview({ booking_id:'bk', user_id:'u', experience_id:'e', rating: 4 }).valid).toBe(true)
  })

  it('is valid with a long body text', () => {
    expect(validateReview({
      booking_id:'bk', user_id:'u', experience_id:'e', rating: 2,
      body: 'A'.repeat(500),
    }).valid).toBe(true)
  })
})

// ── Star display logic ─────────────────────────────────────────────────────────

/**
 * Returns an array of 5 booleans indicating which stars are filled
 * for a given rating (1-5). Mirrors what the star display renders.
 */
function getStarFill(rating) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}

describe('getStarFill — star display logic', () => {
  it('fills 0 stars for rating 0 (no hover, no selection)', () => {
    expect(getStarFill(0)).toEqual([false, false, false, false, false])
  })

  it('fills exactly 1 star for rating 1', () => {
    expect(getStarFill(1)).toEqual([true, false, false, false, false])
  })

  it('fills exactly 3 stars for rating 3', () => {
    expect(getStarFill(3)).toEqual([true, true, true, false, false])
  })

  it('fills all 5 stars for rating 5', () => {
    expect(getStarFill(5)).toEqual([true, true, true, true, true])
  })

  it('always returns an array of length 5', () => {
    for (let r = 0; r <= 5; r++) {
      expect(getStarFill(r)).toHaveLength(5)
    }
  })

  it('count of filled stars equals the rating', () => {
    for (let r = 0; r <= 5; r++) {
      const filled = getStarFill(r).filter(Boolean).length
      expect(filled).toBe(r)
    }
  })
})
