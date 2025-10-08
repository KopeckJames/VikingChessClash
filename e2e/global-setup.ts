import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')

  // Start browser for authentication setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the application to be ready
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Create test user if needed
    await setupTestUser(page)

    console.log('✅ Global setup completed')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestUser(page: any) {
  try {
    // Check if we can access the app without authentication
    const response = await page.goto('/api/health')
    if (response?.ok()) {
      console.log('✅ Health check passed')
    }

    // Setup test data if needed
    // This could include creating test users, games, etc.
  } catch (error) {
    console.log('⚠️ Test user setup skipped:', error.message)
  }
}

export default globalSetup
