/**
 * LIVE INTEGRATION: Edge Function + Unsplash Photo URLs
 *
 * These tests hit real network endpoints. Run with:
 *   npm run test:live
 *
 * They verify:
 *   1. The generate-itinerary edge function is reachable and returns valid JSON
 *   2. The response structure matches what the frontend expects
 *   3. All Unsplash photo URLs in ExperienceCard return HTTP 200
 *
 * NOTE: The edge function requires the Supabase anon key as a Bearer token.
 * Make sure VITE_SUPABASE_ANON_KEY is set in your .env file.
 */
import { describe, it, expect } from 'vitest'
import { PHOTOS } from '../../components/cards/ExperienceCard'

const EDGE_FUNCTION_URL = 'https://vtxikcqasjxyjlxsxdof.supabase.co/functions/v1/generate-itinerary'
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function edgePost(body) {
  return fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(body),
  })
}

const TEST_ANSWERS = {
  city: 'miami',
  startDate: '2025-08-01',
  endDate: '2025-08-03',
  budget: 'mid',
  traveler: 'couple',
  interests: ['food', 'outdoors'],
  extras: 'test run — integration check',
}

describe('Edge function – generate-itinerary (LIVE)', () => {
  it('anon key is available (env check)', () => {
    expect(
      ANON_KEY.length,
      'VITE_SUPABASE_ANON_KEY is missing from .env — all edge function tests will fail with 401'
    ).toBeGreaterThan(10)
  })

  it('responds with 200 and valid JSON', { timeout: 30000 }, async () => {
    const res = await edgePost({ answers: TEST_ANSWERS })

    expect(
      res.status,
      `Expected 200, got ${res.status}. ${res.status === 401 ? 'Check VITE_SUPABASE_ANON_KEY in .env' : 'Check ANTHROPIC_API_KEY secret in Supabase dashboard.'}`
    ).toBe(200)

    let body
    try {
      body = await res.json()
    } catch {
      throw new Error('Response body is not valid JSON — Claude may have returned non-JSON text')
    }

    expect(body, 'Response missing "itinerary" key — edge function returned error').toHaveProperty('itinerary')
  })

  it('itinerary has a non-empty headline', { timeout: 30000 }, async () => {
    const res = await edgePost({ answers: TEST_ANSWERS })
    const { itinerary } = await res.json()
    expect(typeof itinerary?.headline, '"headline" field is missing or not a string').toBe('string')
    expect(itinerary.headline.trim().length, '"headline" is empty').toBeGreaterThan(0)
  })

  it('itinerary.days has the correct number of days (2 nights = 3 days)', { timeout: 30000 }, async () => {
    const res = await edgePost({ answers: TEST_ANSWERS })
    const { itinerary } = await res.json()
    expect(Array.isArray(itinerary?.days), '"days" is not an array').toBe(true)
    expect(itinerary.days.length, `Expected 3 days, got ${itinerary?.days?.length}`).toBe(3)
  })

  it('each day has morning/afternoon/evening/lunch/dinner blocks', { timeout: 30000 }, async () => {
    const res = await edgePost({ answers: TEST_ANSWERS })
    const { itinerary } = await res.json()
    for (const day of itinerary?.days ?? []) {
      const missing = ['morning', 'afternoon', 'evening', 'lunch', 'dinner'].filter(k => !day[k])
      expect(missing, `Day ${day.day} is missing: ${missing.join(', ')}`).toHaveLength(0)
    }
  })

  it('returns 400 with error object for missing answers', { timeout: 15000 }, async () => {
    const res = await edgePost({})
    expect(res.status, 'Expected 400 for empty body').toBe(400)
    const body = await res.json()
    expect(body, 'Expected { error: "..." } in 400 response').toHaveProperty('error')
  })

  it('returns 405 for GET requests', { timeout: 10000 }, async () => {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
    })
    expect(res.status, 'Edge function should reject GET with 405').toBe(405)
  })
})

describe('Unsplash photo URLs – HTTP reachability (LIVE)', () => {
  // Spot-check one URL per city to avoid hammering Unsplash
  const SPOT_CHECK = Object.entries(PHOTOS).map(([city, cats]) => ({
    city,
    category: 'Food & Drink',
    photoId: cats['Food & Drink'],
  }))

  it.each(SPOT_CHECK)(
    '$city / Food & Drink photo returns HTTP 200',
    { timeout: 15000 },
    async ({ city, photoId }) => {
      const url = `https://images.unsplash.com/${photoId}?w=100&h=75&fit=crop&auto=format&q=60`
      const res = await fetch(url, { method: 'HEAD' })
      expect(
        res.status,
        `${city}: photo ID "${photoId}" returned ${res.status}. This photo may have been removed from Unsplash — card will show the gradient fallback instead.`
      ).toBe(200)
    }
  )

  it('default fallback photo ID is reachable', { timeout: 15000 }, async () => {
    const url = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=100&h=75&fit=crop&auto=format&q=60'
    const res = await fetch(url, { method: 'HEAD' })
    expect(res.status, 'Default fallback photo is broken — all unknown category cards will show no image').toBe(200)
  })
})
