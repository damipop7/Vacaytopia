/**
 * Unit tests for the generate-itinerary edge function's rate-limit window math.
 * Replicated from supabase/functions/generate-itinerary/index.ts — the edge function
 * runs on Deno and can't be imported directly into Vitest, so the pure decision logic
 * is mirrored here (same pattern as itinerary-logic.test.js).
 */
import { describe, it, expect } from 'vitest'

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 8

// Mirrors the Supabase query: count rows with created_at >= windowStart (inclusive .gte)
function countInWindow(timestamps, now) {
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  return timestamps.filter(t => t >= windowStart).length
}

function isRateLimited(timestamps, now) {
  return countInWindow(timestamps, now) >= RATE_LIMIT_MAX_REQUESTS
}

describe('itinerary rate limit — window counting', () => {
  const NOW = Date.parse('2026-09-14T12:00:00.000Z')

  it('does not count timestamps older than the window', () => {
    const old = NOW - RATE_LIMIT_WINDOW_MS - 1
    expect(countInWindow([old], NOW)).toBe(0)
  })

  it('counts a timestamp exactly at the window boundary (inclusive)', () => {
    const boundary = NOW - RATE_LIMIT_WINDOW_MS
    expect(countInWindow([boundary], NOW)).toBe(1)
  })

  it('counts recent timestamps within the window', () => {
    const recent = NOW - 5 * 60 * 1000 // 5 min ago
    expect(countInWindow([recent], NOW)).toBe(1)
  })

  it('mixes in-window and out-of-window timestamps correctly', () => {
    const timestamps = [
      NOW - 10 * 60 * 1000,                    // in window
      NOW - 30 * 60 * 1000,                    // in window
      NOW - RATE_LIMIT_WINDOW_MS - 5000,       // out of window
    ]
    expect(countInWindow(timestamps, NOW)).toBe(2)
  })
})

describe('itinerary rate limit — blocking decision', () => {
  const NOW = Date.parse('2026-09-14T12:00:00.000Z')
  const withinWindow = (n) => Array.from({ length: n }, (_, i) => NOW - i * 1000)

  it('allows requests below the max', () => {
    expect(isRateLimited(withinWindow(RATE_LIMIT_MAX_REQUESTS - 1), NOW)).toBe(false)
  })

  it('blocks once the count reaches the max', () => {
    expect(isRateLimited(withinWindow(RATE_LIMIT_MAX_REQUESTS), NOW)).toBe(true)
  })

  it('blocks when the count exceeds the max', () => {
    expect(isRateLimited(withinWindow(RATE_LIMIT_MAX_REQUESTS + 3), NOW)).toBe(true)
  })

  it('allows again once old requests age out of the window', () => {
    const timestamps = withinWindow(RATE_LIMIT_MAX_REQUESTS).map(t => t - RATE_LIMIT_WINDOW_MS)
    expect(isRateLimited(timestamps, NOW)).toBe(false)
  })

  it('allows a user with zero prior requests', () => {
    expect(isRateLimited([], NOW)).toBe(false)
  })
})
