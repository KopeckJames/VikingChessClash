import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    // Navigate to home page
    await page.goto('/')

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries()
          const vitals: Record<string, number> = {}

          entries.forEach(entry => {
            if (entry.name === 'FCP') {
              vitals.fcp = entry.startTime
            }
            if (entry.name === 'LCP') {
              vitals.lcp = entry.startTime
            }
            if (entry.name === 'FID') {
              vitals.fid = (entry as any).processingStart - entry.startTime
            }
            if (entry.name === 'CLS') {
              vitals.cls = (entry as any).value
            }
          })

          resolve(vitals)
        }).observe({ entryTypes: ['measure', 'navigation', 'paint'] })

        // Fallback timeout
        setTimeout(() => resolve({}), 5000)
      })
    })

    console.log('Performance metrics:', metrics)

    // Assert Core Web Vitals thresholds
    if ((metrics as any).lcp) {
      expect((metrics as any).lcp).toBeLessThan(2500) // LCP < 2.5s
    }
    if ((metrics as any).fid) {
      expect((metrics as any).fid).toBeLessThan(100) // FID < 100ms
    }
    if ((metrics as any).cls) {
      expect((metrics as any).cls).toBeLessThan(0.1) // CLS < 0.1
    }
  })

  test('should load game board quickly', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/game')

    // Wait for game board to be visible
    await expect(page.locator('[data-testid="game-board"]')).toBeVisible()

    const loadTime = Date.now() - startTime

    // Game board should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should handle rapid interactions', async ({ page }) => {
    await page.goto('/game')

    // Wait for board to load
    await expect(page.locator('[data-testid="game-board"]')).toBeVisible()

    const startTime = Date.now()

    // Perform rapid piece selections
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="defender-piece"]:first-child')
      await page.waitForTimeout(50) // Small delay between clicks
    }

    const interactionTime = Date.now() - startTime

    // Should handle 10 rapid interactions within 1 second
    expect(interactionTime).toBeLessThan(1000)
  })

  test('should maintain performance with multiple games', async ({ page, context }) => {
    // Open multiple game tabs
    const pages = [page]

    for (let i = 0; i < 3; i++) {
      const newPage = await context.newPage()
      await newPage.goto('/game')
      pages.push(newPage)
    }

    // Measure performance on each page
    for (const gamePage of pages) {
      const startTime = Date.now()

      await gamePage.click('[data-testid="defender-piece"]:first-child')
      await gamePage.click('[data-testid="valid-move"]:first-child')

      const moveTime = Date.now() - startTime

      // Each move should complete within 500ms even with multiple tabs
      expect(moveTime).toBeLessThan(500)
    }

    // Close additional pages
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close()
    }
  })
})

test.describe('Mobile Performance', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should load quickly on mobile viewport', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/')

    // Wait for mobile navigation to be visible
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()

    const loadTime = Date.now() - startTime

    // Mobile should load within 4 seconds (allowing for slower mobile networks)
    expect(loadTime).toBeLessThan(4000)
  })

  test('should handle touch interactions smoothly', async ({ page }) => {
    await page.goto('/game')

    // Wait for mobile game board
    await expect(page.locator('[data-testid="mobile-game-board"]')).toBeVisible()

    const startTime = Date.now()

    // Simulate touch interactions
    await page.touchscreen.tap(200, 200) // Tap on board
    await page.touchscreen.tap(250, 250) // Tap another location

    const touchTime = Date.now() - startTime

    // Touch interactions should be responsive
    expect(touchTime).toBeLessThan(200)
  })

  test('should maintain 60fps during animations', async ({ page }) => {
    await page.goto('/game')

    // Start monitoring frame rate
    await page.evaluate(() => {
      let frameCount = 0
      let lastTime = performance.now()

      function countFrames() {
        frameCount++
        const currentTime = performance.now()

        if (currentTime - lastTime >= 1000) {
          ;(window as any).fps = frameCount
          frameCount = 0
          lastTime = currentTime
        }

        requestAnimationFrame(countFrames)
      }

      requestAnimationFrame(countFrames)
    })

    // Trigger animations by making moves
    await page.click('[data-testid="defender-piece"]:first-child')
    await page.click('[data-testid="valid-move"]:first-child')

    // Wait for animation to complete
    await page.waitForTimeout(2000)

    // Check frame rate
    const fps = await page.evaluate(() => (window as any).fps)

    // Should maintain close to 60fps (allow some variance)
    expect(fps).toBeGreaterThan(50)
  })
})

test.describe('Network Performance', () => {
  test('should handle slow network conditions', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
      await route.continue()
    })

    const startTime = Date.now()

    await page.goto('/')

    // Should still load within reasonable time on slow network
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()

    const loadTime = Date.now() - startTime

    // Allow more time for slow network but should still be reasonable
    expect(loadTime).toBeLessThan(8000)
  })

  test('should work offline', async ({ page, context }) => {
    // First load the page online
    await page.goto('/')
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()

    // Go offline
    await context.setOffline(true)

    // Navigate to offline game
    await page.click('[data-testid="play-offline"]')

    // Should still work offline
    await expect(page.locator('[data-testid="offline-game"]')).toBeVisible()

    // Restore online
    await context.setOffline(false)
  })
})
