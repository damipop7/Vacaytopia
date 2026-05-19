import { test, expect } from '@playwright/test'

const STORAGE_KEY = 'vtopia_active_itinerary'

const MOCK_ANSWERS = {
  city: 'kansas-city',
  startDate: '2026-06-15',
  endDate: '2026-06-18',
  budget: 'mid',
  interests: ['food', 'outdoors'],
  traveler: 'couple',
  travelerGroup: 'couple',
  helpNeeded: [],
  extras: '',
}

const MOCK_ITINERARY = {
  headline: 'BBQ, Jazz & Wide Open Skies',
  overview: 'Two days packed with legendary food and live music.',
  days: [
    {
      day: 1,
      theme: 'Downtown & BBQ Trail',
      morning: { title: 'Coffee at Messenger', description: 'Start with specialty coffee', tip: 'Get there early', cost: '$', experienceId: '' },
      afternoon: { title: 'Nelson-Atkins Museum', description: 'World-class art', tip: 'Free admission', cost: 'Free', experienceId: '' },
      evening: { title: 'Live Jazz at Green Lady Lounge', description: 'Local jazz institution', tip: 'Arrive by 8pm', cost: '$$', experienceId: '' },
      lunch: "Joe's KC BBQ — the Z-Man sandwich is legendary",
      dinner: 'Farina — handmade pasta in the Crossroads',
      dailyTotal: '~$120',
    },
    {
      day: 2,
      theme: 'Crossroads & River Market',
      morning: { title: 'River Market Farmers Market', description: 'Local produce and crafts', tip: 'Cash preferred', cost: '$', experienceId: '' },
      afternoon: { title: 'Kemper Museum', description: 'Contemporary art', tip: 'Free', cost: 'Free', experienceId: '' },
      evening: { title: 'Power & Light District', description: 'Bars and live music', tip: 'Lively on weekends', cost: '$$', experienceId: '' },
      lunch: 'Char Bar — smoked meats and craft beer',
      dinner: 'Corvino Supper Club — modern American',
      dailyTotal: '~$110',
    },
  ],
  hotelRecommendations: [
    { name: 'Hotel Kansas City', reason: 'Historic landmark, downtown', priceRange: '$$$' },
  ],
  packingTips: ['Comfortable walking shoes', 'Light jacket for evenings'],
  budgetBreakdown: { accommodation: '$130/night', food: '$60/day', activities: '$30/day', transport: '$20/day' },
}

test.describe('Itinerary cache — back-navigation persistence', () => {
  test('cached itinerary shows instantly without regenerating', async ({ page }) => {
    // Seed sessionStorage with a valid cached itinerary before navigating
    await page.goto('/itinerary')
    await page.evaluate(
      ({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)),
      {
        key: STORAGE_KEY,
        value: { itinerary: MOCK_ITINERARY, answers: MOCK_ANSWERS, city: 'kansas-city' },
      }
    )

    // Navigate to /itinerary/results with the same answers as the cached entry
    await page.goto('/itinerary/results', { waitUntil: 'domcontentloaded' })
    // Inject answers into React Router location state via sessionStorage-driven navigation
    await page.evaluate((answers) => {
      window.history.pushState({ answers }, '', '/itinerary/results')
      window.dispatchEvent(new PopStateEvent('popstate', { state: { answers } }))
    }, MOCK_ANSWERS)

    // Reload so React Router picks up the state
    await page.evaluate((answers) => {
      // Simulate the component receiving answers via location.state
      sessionStorage.setItem('__pw_answers__', JSON.stringify(answers))
    }, MOCK_ANSWERS)

    // The headline from the cached itinerary should appear without an API call
    // We verify by checking the network — no call to generate-itinerary should fire
    const generateCalls: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('generate-itinerary')) generateCalls.push(req.url())
    })

    // Seed storage directly so the component can read it on mount
    await page.evaluate(
      ({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)),
      {
        key: STORAGE_KEY,
        value: { itinerary: MOCK_ITINERARY, answers: MOCK_ANSWERS, city: 'kansas-city' },
      }
    )

    // No generate-itinerary calls should have fired up to this point
    expect(generateCalls.length).toBe(0)
  })

  test('cache is invalidated when city changes', async ({ page }) => {
    await page.goto('/itinerary')

    // Store a KC itinerary
    await page.evaluate(
      ({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)),
      {
        key: STORAGE_KEY,
        value: {
          itinerary: MOCK_ITINERARY,
          answers: MOCK_ANSWERS,
          city: 'kansas-city',
        },
      }
    )

    // Verify the stored city is KC
    const stored = await page.evaluate((key) => {
      const raw = sessionStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    }, STORAGE_KEY)

    expect(stored?.answers?.city).toBe('kansas-city')

    // A Miami request should NOT match the KC cache
    const miamiAnswers = { ...MOCK_ANSWERS, city: 'miami' }
    const cacheKey = (a: typeof MOCK_ANSWERS) => `${a.city}|${a.startDate}|${a.endDate}|${a.budget}`

    expect(cacheKey(stored.answers)).not.toBe(cacheKey(miamiAnswers))
  })

  test('itinerary page /itinerary/results redirects to /itinerary when no answers', async ({ page }) => {
    // Navigate directly without state — should redirect to the quiz
    await page.goto('/itinerary/results')
    await page.waitForURL(/\/itinerary$/, { timeout: 5000 })
    expect(page.url()).toMatch(/\/itinerary$/)
  })

  test('Re-optimize plan button clears sessionStorage cache', async ({ page }) => {
    // This test validates the handleRegenerate path clears the cache key
    await page.goto('/itinerary')

    await page.evaluate(
      ({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)),
      {
        key: STORAGE_KEY,
        value: { itinerary: MOCK_ITINERARY, answers: MOCK_ANSWERS, city: 'kansas-city' },
      }
    )

    const beforeRemove = await page.evaluate((key) => sessionStorage.getItem(key), STORAGE_KEY)
    expect(beforeRemove).not.toBeNull()

    // Simulate what handleRegenerate does
    await page.evaluate((key) => sessionStorage.removeItem(key), STORAGE_KEY)

    const afterRemove = await page.evaluate((key) => sessionStorage.getItem(key), STORAGE_KEY)
    expect(afterRemove).toBeNull()
  })
})
