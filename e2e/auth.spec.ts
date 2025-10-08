import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form', async ({ page }) => {
    // Navigate to auth page
    await page.click('[data-testid="login-button"]')

    // Check if login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.click('[data-testid="login-button"]')

    // Try to submit empty form
    await page.click('[data-testid="submit-login"]')

    // Check for validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
  })

  test('should handle login attempt', async ({ page }) => {
    await page.click('[data-testid="login-button"]')

    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword')

    // Submit form
    await page.click('[data-testid="submit-login"]')

    // Should show loading state or redirect
    await expect(page.locator('[data-testid="loading"]')).toBeVisible()
  })

  test('should display registration form', async ({ page }) => {
    await page.click('[data-testid="register-button"]')

    // Check if registration form is visible
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible()
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('should validate password strength', async ({ page }) => {
    await page.click('[data-testid="register-button"]')

    // Fill weak password
    await page.fill('input[name="password"]', '123')
    await page.blur('input[name="password"]')

    // Check for password strength indicator
    await expect(page.locator('[data-testid="password-strength"]')).toContainText('Weak')
  })
})

test.describe('Authentication - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should display mobile-optimized auth forms', async ({ page }) => {
    await page.goto('/')

    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible()

    // Open mobile menu
    await page.click('[data-testid="mobile-nav-toggle"]')
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible()

    // Navigate to login
    await page.click('[data-testid="mobile-login-button"]')

    // Check mobile-optimized form
    await expect(page.locator('[data-testid="mobile-auth-form"]')).toBeVisible()
  })

  test('should handle touch interactions', async ({ page }) => {
    await page.goto('/auth')

    // Test touch-friendly button sizes
    const loginButton = page.locator('[data-testid="submit-login"]')
    const boundingBox = await loginButton.boundingBox()

    // Verify minimum touch target size (44px)
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
  })
})
