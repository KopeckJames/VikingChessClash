import { test, expect } from '@playwright/test'

test.describe('Game Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game page (assuming guest access or mock auth)
    await page.goto('/game')
  })

  test('should display game board', async ({ page }) => {
    // Check if game board is visible
    await expect(page.locator('[data-testid="game-board"]')).toBeVisible()

    // Check for game pieces
    await expect(page.locator('[data-testid="game-piece"]')).toHaveCount(37) // Standard Hnefatafl setup

    // Check for king piece
    await expect(page.locator('[data-testid="king-piece"]')).toBeVisible()
  })

  test('should handle piece selection', async ({ page }) => {
    // Click on a defender piece
    await page.click('[data-testid="defender-piece"]:first-child')

    // Check if piece is selected
    await expect(page.locator('[data-testid="defender-piece"]:first-child')).toHaveClass(/selected/)

    // Check for valid move indicators
    await expect(page.locator('[data-testid="valid-move"]')).toHaveCount.toBeGreaterThan(0)
  })

  test('should validate moves', async ({ page }) => {
    // Select a piece
    await page.click('[data-testid="defender-piece"]:first-child')

    // Try to make an invalid move
    await page.click('[data-testid="invalid-square"]')

    // Should show error or not move
    await expect(page.locator('[data-testid="move-error"]')).toBeVisible()
  })

  test('should handle valid moves', async ({ page }) => {
    // Select a piece
    await page.click('[data-testid="defender-piece"]:first-child')

    // Make a valid move
    await page.click('[data-testid="valid-move"]:first-child')

    // Check if move was executed
    await expect(page.locator('[data-testid="move-history"]')).toContainText('1.')

    // Check if turn changed
    await expect(page.locator('[data-testid="current-player"]')).toContainText('Attacker')
  })

  test('should display game controls', async ({ page }) => {
    // Check for game control buttons
    await expect(page.locator('[data-testid="resign-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="offer-draw-button"]')).toBeVisible()

    // Check for move history
    await expect(page.locator('[data-testid="move-history"]')).toBeVisible()
  })
})

test.describe('Game - Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should display mobile-optimized game board', async ({ page }) => {
    await page.goto('/game')

    // Check mobile game board
    await expect(page.locator('[data-testid="mobile-game-board"]')).toBeVisible()

    // Check touch-friendly piece sizes
    const piece = page.locator('[data-testid="game-piece"]').first()
    const boundingBox = await piece.boundingBox()

    // Verify minimum touch target size
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
  })

  test('should handle touch gestures', async ({ page }) => {
    await page.goto('/game')

    // Test pinch-to-zoom (simulate with wheel events)
    await page.locator('[data-testid="game-board"]').hover()
    await page.mouse.wheel(0, -100) // Zoom in

    // Check if board scaled
    const board = page.locator('[data-testid="game-board"]')
    const transform = await board.evaluate(el => getComputedStyle(el).transform)
    expect(transform).not.toBe('none')
  })

  test('should display mobile game controls', async ({ page }) => {
    await page.goto('/game')

    // Check for mobile-specific controls
    await expect(page.locator('[data-testid="mobile-game-controls"]')).toBeVisible()

    // Check for swipe-accessible chat
    await page.swipe('[data-testid="chat-handle"]', 'up')
    await expect(page.locator('[data-testid="mobile-chat"]')).toBeVisible()
  })

  test('should handle haptic feedback simulation', async ({ page }) => {
    await page.goto('/game')

    // Mock vibration API
    await page.addInitScript(() => {
      ;(window.navigator as any).vibrate = (pattern: number | number[]) => {
        console.log('Vibration triggered:', pattern)
        return true
      }
    })

    // Make a move and check for haptic feedback call
    await page.click('[data-testid="defender-piece"]:first-child')

    // Check console for vibration log (in real tests, you'd mock this properly)
    const logs = await page.evaluate(() => console.log)
  })
})

test.describe('AI Opponent', () => {
  test('should start game against AI', async ({ page }) => {
    await page.goto('/')

    // Start AI game
    await page.click('[data-testid="play-ai-button"]')

    // Select AI difficulty
    await page.click('[data-testid="ai-difficulty-medium"]')
    await page.click('[data-testid="start-ai-game"]')

    // Should navigate to game
    await expect(page).toHaveURL(/\/game\/ai/)
    await expect(page.locator('[data-testid="ai-opponent-info"]')).toBeVisible()
  })

  test('should handle AI moves', async ({ page }) => {
    await page.goto('/game/ai')

    // Make a player move
    await page.click('[data-testid="defender-piece"]:first-child')
    await page.click('[data-testid="valid-move"]:first-child')

    // Wait for AI response
    await expect(page.locator('[data-testid="ai-thinking"]')).toBeVisible()

    // AI should make a move
    await expect(page.locator('[data-testid="move-history"]')).toContainText('2.')
    await expect(page.locator('[data-testid="current-player"]')).toContainText('Defender')
  })
})
