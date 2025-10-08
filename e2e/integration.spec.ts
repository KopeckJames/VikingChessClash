import { test, expect } from '@playwright/test'

test.describe('Full Application Integration', () => {
  test('should complete full user journey', async ({ page }) => {
    // 1. Landing page
    await page.goto('/')
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible()

    // 2. Navigate to authentication
    await page.click('[data-testid="get-started-button"]')
    await expect(page).toHaveURL(/\/auth/)

    // 3. Register new user (mock)
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('[data-testid="register-submit"]')

    // 4. Navigate to game lobby
    await expect(page).toHaveURL(/\/lobby/)
    await expect(page.locator('[data-testid="lobby-content"]')).toBeVisible()

    // 5. Start AI game
    await page.click('[data-testid="play-ai-button"]')
    await page.click('[data-testid="ai-difficulty-easy"]')
    await page.click('[data-testid="start-game"]')

    // 6. Play game
    await expect(page).toHaveURL(/\/game/)
    await expect(page.locator('[data-testid="game-board"]')).toBeVisible()

    // Make a move
    await page.click('[data-testid="defender-piece"]:first-child')
    await page.click('[data-testid="valid-move"]:first-child')

    // 7. Check game state
    await expect(page.locator('[data-testid="move-history"]')).toContainText('1.')
    await expect(page.locator('[data-testid="current-player"]')).toContainText('Attacker')

    // 8. Navigate to profile
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="profile-link"]')

    await expect(page).toHaveURL(/\/profile/)
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible()

    // 9. Check leaderboard
    await page.click('[data-testid="leaderboard-link"]')
    await expect(page).toHaveURL(/\/leaderboard/)
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible()
  })

  test('should handle offline functionality', async ({ page, context }) => {
    // Load page online first
    await page.goto('/')
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()

    // Go offline
    await context.setOffline(true)

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()

    // Start offline game
    await page.click('[data-testid="play-offline"]')
    await expect(page.locator('[data-testid="offline-game"]')).toBeVisible()

    // Should be able to play against AI offline
    await page.click('[data-testid="defender-piece"]:first-child')
    await page.click('[data-testid="valid-move"]:first-child')

    await expect(page.locator('[data-testid="move-history"]')).toContainText('1.')

    // Go back online
    await context.setOffline(false)

    // Should sync data when back online
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible()
  })

  test('should handle real-time multiplayer', async ({ page, context }) => {
    // Create two browser contexts for two players
    const player1Page = page
    const player2Page = await context.newPage()

    // Player 1: Create game
    await player1Page.goto('/lobby')
    await player1Page.click('[data-testid="create-game"]')
    await player1Page.click('[data-testid="public-game"]')
    await player1Page.click('[data-testid="create-game-submit"]')

    // Get game URL
    const gameUrl = player1Page.url()

    // Player 2: Join game
    await player2Page.goto(gameUrl)
    await player2Page.click('[data-testid="join-game"]')

    // Both players should see game start
    await expect(player1Page.locator('[data-testid="game-started"]')).toBeVisible()
    await expect(player2Page.locator('[data-testid="game-started"]')).toBeVisible()

    // Player 1 makes move (assuming they're defender)
    await player1Page.click('[data-testid="defender-piece"]:first-child')
    await player1Page.click('[data-testid="valid-move"]:first-child')

    // Player 2 should see the move in real-time
    await expect(player2Page.locator('[data-testid="move-history"]')).toContainText('1.')
    await expect(player2Page.locator('[data-testid="current-player"]')).toContainText('Attacker')

    // Test chat functionality
    await player1Page.fill('[data-testid="chat-input"]', 'Good luck!')
    await player1Page.press('[data-testid="chat-input"]', 'Enter')

    await expect(player2Page.locator('[data-testid="chat-messages"]')).toContainText('Good luck!')

    await player2Page.close()
  })

  test('should handle tournament flow', async ({ page }) => {
    await page.goto('/tournaments')

    // View available tournaments
    await expect(page.locator('[data-testid="tournaments-list"]')).toBeVisible()

    // Register for tournament
    await page.click('[data-testid="tournament-card"]:first-child')
    await page.click('[data-testid="register-tournament"]')

    // Should show registration confirmation
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible()

    // View tournament bracket
    await page.click('[data-testid="view-bracket"]')
    await expect(page.locator('[data-testid="tournament-bracket"]')).toBeVisible()

    // Should show user in bracket
    await expect(page.locator('[data-testid="bracket-participant"]')).toContainText('testuser')
  })
})

test.describe('Error Handling Integration', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    await page.goto('/')

    // Simulate network failure
    await context.route('**/api/**', route => route.abort())

    // Try to perform action that requires API
    await page.click('[data-testid="login-button"]')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('[data-testid="submit-login"]')

    // Should show error message
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()

    // Should offer retry option
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('should handle server errors', async ({ page, context }) => {
    // Mock server error responses
    await context.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })

    await page.goto('/')

    // Try action that triggers API call
    await page.click('[data-testid="leaderboard-link"]')

    // Should show error state
    await expect(page.locator('[data-testid="server-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('server error')
  })

  test('should handle invalid game states', async ({ page }) => {
    // Navigate to game with invalid ID
    await page.goto('/game/invalid-game-id')

    // Should show game not found
    await expect(page.locator('[data-testid="game-not-found"]')).toBeVisible()

    // Should offer navigation back to lobby
    await expect(page.locator('[data-testid="back-to-lobby"]')).toBeVisible()
  })
})

test.describe('Accessibility Integration', () => {
  test('should be fully keyboard navigable', async ({ page }) => {
    await page.goto('/')

    // Navigate using only keyboard
    await page.keyboard.press('Tab') // Focus first interactive element
    await page.keyboard.press('Enter') // Activate element

    // Continue tabbing through interface
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')

      // Check that focused element is visible
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  })

  test('should work with screen reader', async ({ page }) => {
    await page.goto('/game')

    // Check for proper ARIA labels
    await expect(page.locator('[data-testid="game-board"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="game-piece"]').first()).toHaveAttribute('aria-label')

    // Check for live regions
    await expect(page.locator('[aria-live="polite"]')).toBeVisible()

    // Make move and check announcements
    await page.click('[data-testid="defender-piece"]:first-child')
    await page.click('[data-testid="valid-move"]:first-child')

    // Should announce move to screen reader
    await expect(page.locator('[aria-live="polite"]')).toContainText('moved')
  })

  test('should support high contrast mode', async ({ page }) => {
    // Enable high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })

    await page.goto('/')

    // Check that high contrast styles are applied
    const backgroundColor = await page
      .locator('body')
      .evaluate(el => getComputedStyle(el).backgroundColor)

    // Should use high contrast colors
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)') // Not default white
  })
})
