import { test, expect } from '@playwright/test'

// These routes should render real content (not crash / show a blank screen)
const PUBLIC_ROUTES = [
  '/',
  '/browse',
  '/itinerary',
  '/world-cup',
  '/kansas-city',
  '/privacy',
  '/terms',
]

test.describe('Public routes', () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} — loads without crashing`, async ({ page }) => {
      await page.goto(path)
      // Wait for React to hydrate and lazy chunks to load
      await page.waitForLoadState('domcontentloaded')

      const body = await page.textContent('body')
      // Page must render more than just the script tags
      expect(body!.length, `${path} body is nearly empty`).toBeGreaterThan(100)
      // Must not be a white-screen JS crash
      expect(body, `${path} shows an error boundary`).not.toMatch(/something went wrong.*unexpected|uncaught error/i)
    })
  }

  test('unknown route shows 404 page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz')
    // NotFoundPage renders "This page got lost in transit" and "404"
    await expect(page.getByText('404').or(page.getByText(/got lost|not found/i)).first()).toBeVisible({
      timeout: 8_000,
    })
  })
})

test.describe('Nav links', () => {
  test('clicking Browse from home navigates correctly', async ({ page }) => {
    await page.goto('/')
    const browseLink = page.getByRole('link', { name: /browse/i }).first()
    if (await browseLink.isVisible()) {
      await browseLink.click()
      await expect(page).toHaveURL(/\/browse/)
    }
  })

  test('clicking Plan / Itinerary from home navigates correctly', async ({ page }) => {
    await page.goto('/')
    const planLink = page.getByRole('link', { name: /plan|itinerary/i }).first()
    if (await planLink.isVisible()) {
      await planLink.click()
      await expect(page).toHaveURL(/\/itinerary/)
    }
  })
})
