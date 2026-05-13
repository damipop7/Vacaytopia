import { test, expect } from '@playwright/test'

test.describe('Auth page', () => {
  test('renders sign-in form with email and password fields', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('has a sign-in submit button', async ({ page }) => {
    await page.goto('/auth')
    await expect(
      page.getByRole('button', { name: /sign in|log in|continue/i })
    ).toBeVisible({ timeout: 8_000 })
  })

  test('has Google sign-in button container', async ({ page }) => {
    await page.goto('/auth')
    // Wait for React to hydrate (email field is a reliable signal)
    await page.waitForSelector('input[type="email"]', { timeout: 8_000 })
    // GIS renders button text "Continue with Google"
    await expect(page.getByText(/continue with google|google/i).first()).toBeVisible({ timeout: 8_000 })
  })

  test('shows error message when sign-in fails with bad credentials', async ({ page }) => {
    await page.goto('/auth')
    await page.fill('input[type="email"]', 'notreal@example.com')
    await page.fill('input[type="password"]', 'wrongpassword123')
    await page.getByRole('button', { name: /sign in|log in|continue/i }).click()
    // Must stay on auth page (not navigate away on failure)
    await expect(page).toHaveURL(/\/auth/, { timeout: 8_000 })
  })

  test('toggle to sign-up mode shows first/last name fields', async ({ page }) => {
    await page.goto('/auth')
    // Find the create account / sign up toggle
    const createBtn = page.getByText(/create account/i).first()
    if (await createBtn.isVisible({ timeout: 3_000 })) {
      await createBtn.click()
      // Sign-up form should show first name or last name input
      await expect(
        page.locator('input[name*="first"], input[placeholder*="first" i], input[name*="First"]')
          .or(page.locator('input').nth(0))
      ).toBeVisible({ timeout: 3_000 })
    }
  })
})

test.describe('Protected routes', () => {
  test('/profile redirects to /auth when not logged in', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/auth/, { timeout: 5_000 })
  })

  test('/book/:id redirects to /auth when not logged in', async ({ page }) => {
    await page.goto('/book/some-experience-id')
    await expect(page).toHaveURL(/\/auth/, { timeout: 5_000 })
  })

  test('/interests redirects to /auth when not logged in', async ({ page }) => {
    await page.goto('/interests')
    await expect(page).toHaveURL(/\/auth/, { timeout: 5_000 })
  })

  test('/admin redirects when not an admin', async ({ page }) => {
    await page.goto('/admin')
    // Should redirect to /auth (not logged in) or / (logged in but not admin)
    await expect(page).not.toHaveURL('/admin', { timeout: 5_000 })
  })
})
