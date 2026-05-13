import { test, expect } from '@playwright/test'

// The quiz advances via a "Continue →" button — city card click just selects, doesn't auto-advance.

test.describe('Itinerary Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/itinerary')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders the first step — city selection', async ({ page }) => {
    await expect(page.getByText(/where are you headed/i)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText(/kansas city/i).first()).toBeVisible()
  })

  test('progress counter shows "1 / 8"', async ({ page }) => {
    await expect(page.getByText('1 / 8')).toBeVisible({ timeout: 8_000 })
  })

  test('can select a city and advance to date step by clicking Continue', async ({ page }) => {
    // Select Kansas City
    await page.getByText('Kansas City').first().click()
    // Click the Continue button to advance
    await page.getByRole('button', { name: /continue/i }).click()

    // Dates step should now show
    await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/when.s the trip/i)).toBeVisible()
  })

  test('can walk through city → dates → budget steps', async ({ page }) => {
    // Step 1: city
    await page.getByText('Kansas City').first().click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 2: dates
    await page.waitForSelector('input[type="date"]', { timeout: 5_000 })
    const dateInputs = page.locator('input[type="date"]')
    await dateInputs.nth(0).fill('2026-07-10')
    await dateInputs.nth(1).fill('2026-07-13')
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 3: budget
    await expect(page.getByText(/what.s your budget/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/budget|mid-range|premium/i).first()).toBeVisible()
  })

  test('can select budget and advance to vibe/interests step', async ({ page }) => {
    // City
    await page.getByText('Kansas City').first().click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Dates
    await page.waitForSelector('input[type="date"]', { timeout: 5_000 })
    const dateInputs = page.locator('input[type="date"]')
    await dateInputs.nth(0).fill('2026-07-10')
    await dateInputs.nth(1).fill('2026-07-13')
    await page.getByRole('button', { name: /continue/i }).click()

    // Budget — click Mid-Range and continue
    await page.waitForTimeout(300)
    await page.getByText('Mid-Range').click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Vibe/interests step
    await expect(page.getByText(/what.s your vibe/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/food|outdoors|nightlife/i).first()).toBeVisible()
  })

  test('dates are validated — end before start shows error', async ({ page }) => {
    // City
    await page.getByText('Kansas City').first().click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Set end date before start date
    await page.waitForSelector('input[type="date"]', { timeout: 5_000 })
    const dateInputs = page.locator('input[type="date"]')
    await dateInputs.nth(0).fill('2026-07-15')
    await dateInputs.nth(1).fill('2026-07-10')
    await page.getByRole('button', { name: /continue/i }).click()

    // Should show a validation error
    await expect(page.getByText(/end date must be after/i)).toBeVisible({ timeout: 3_000 })
  })
})
