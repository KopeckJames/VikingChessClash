import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')

  try {
    // Cleanup test data if needed
    await cleanupTestData()

    console.log('✅ Global teardown completed')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
  }
}

async function cleanupTestData() {
  // Clean up any test data created during tests
  // This could include removing test users, games, etc.
  console.log('🗑️ Cleaning up test data...')
}

export default globalTeardown
