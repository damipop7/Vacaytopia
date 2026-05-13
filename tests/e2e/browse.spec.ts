import { test, expect } from '@playwright/test'

test.describe('Browse page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse')
  })

  test('loads without error', async ({ page }) => {
    await expect(page.locator('body')).not.toBeEmpty()
    // Should not show a crash/boundary error
    const body = await page.textContent('body')
    expect(body).not.toMatch(/something went wrong|unexpected error|cannot read/i)
  })

  test('shows category filter buttons', async ({ page }) => {
    const categories = ['Food', 'Outdoors', 'Nightlife', 'Sports', 'Arts', 'Wellness']
    for (const cat of categories) {
      await expect(
        page.getByRole('button', { name: new RegExp(cat, 'i') })
          .or(page.getByText(new RegExp(cat, 'i')).first())
      ).toBeVisible({ timeout: 8_000 })
    }
  })

  test('has city selector', async ({ page }) => {
    // City filter appears as buttons or a select element
    const citySelector = page.getByRole('button', { name: /kansas city|all cities|city/i })
      .or(page.getByRole('combobox'))
      .or(page.getByText(/kansas city/i).first())
    await expect(citySelector.first()).toBeVisible({ timeout: 8_000 })
  })

  test('switching to Food & Drink category shows filtered results or empty state', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2_000)
    const foodBtn = page.getByRole('button', { name: /food/i }).first()
    if (await foodBtn.isVisible()) {
      await foodBtn.click()
      // Either shows results or "no experiences" message — both valid
      await page.waitForTimeout(1_000)
      const body = await page.textContent('body')
      expect(body!.length).toBeGreaterThan(100)
    }
  })

  test('/browse/kansas-city loads the city-specific view', async ({ page }) => {
    await page.goto('/browse/kansas-city')
    await expect(page.locator('body')).not.toBeEmpty()
    const body = await page.textContent('body')
    expect(body).not.toMatch(/something went wrong|unexpected error/i)
  })
})
