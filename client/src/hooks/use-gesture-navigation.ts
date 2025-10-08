/**
 * Gesture navigation hook for accessibility
 * Provides alternative navigation methods for users with motor impairments
 */

import { useEffect, useRef, useCallback } from 'react'
import { announceToScreenReader } from '@/lib/accessibility'

interface GestureConfig {
  swipeThreshold: number
  longPressDelay: number
  doubleTapDelay: number
  enabled: boolean
}

interface GestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onLongPress?: (element: HTMLElement) => void
  onDoubleTap?: (element: HTMLElement) => void
  onPinch?: (scale: number) => void
}

const defaultConfig: GestureConfig = {
  swipeThreshold: 50,
  longPressDelay: 500,
  doubleTapDelay: 300,
  enabled: true,
}

export function useGestureNavigation(
  elementRef: React.RefObject<HTMLElement>,
  handlers: GestureHandlers,
  config: Partial<GestureConfig> = {}
) {
  const configRef = useRef({ ...defaultConfig, ...config })
  const gestureStateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTap: 0,
    longPressTimer: null as NodeJS.Timeout | null,
    isPinching: false,
    initialDistance: 0,
  })

  // Update config
  configRef.current = { ...defaultConfig, ...config }

  // Touch start handler
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!configRef.current.enabled) return

      const touch = e.touches[0]
      const state = gestureStateRef.current

      state.startX = touch.clientX
      state.startY = touch.clientY
      state.startTime = Date.now()

      // Handle multi-touch (pinch)
      if (e.touches.length === 2) {
        state.isPinching = true
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        state.initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        )
      } else {
        state.isPinching = false

        // Start long press timer
        if (handlers.onLongPress) {
          state.longPressTimer = setTimeout(() => {
            const target = e.target as HTMLElement
            handlers.onLongPress?.(target)
            announceToScreenReader('Long press detected')

            // Haptic feedback if available
            if ('vibrate' in navigator) {
              navigator.vibrate(50)
            }
          }, configRef.current.longPressDelay)
        }
      }
    },
    [handlers]
  )

  // Touch move handler
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!configRef.current.enabled) return

      const state = gestureStateRef.current

      // Handle pinch gesture
      if (state.isPinching && e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        )

        if (state.initialDistance > 0) {
          const scale = currentDistance / state.initialDistance
          handlers.onPinch?.(scale)
        }
      }

      // Cancel long press if finger moves too much
      if (state.longPressTimer) {
        const touch = e.touches[0]
        const deltaX = Math.abs(touch.clientX - state.startX)
        const deltaY = Math.abs(touch.clientY - state.startY)

        if (deltaX > 10 || deltaY > 10) {
          clearTimeout(state.longPressTimer)
          state.longPressTimer = null
        }
      }
    },
    [handlers]
  )

  // Touch end handler
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!configRef.current.enabled) return

      const state = gestureStateRef.current
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - state.startX
      const deltaY = touch.clientY - state.startY
      const deltaTime = Date.now() - state.startTime
      const threshold = configRef.current.swipeThreshold

      // Clear long press timer
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer)
        state.longPressTimer = null
      }

      // Reset pinch state
      if (state.isPinching) {
        state.isPinching = false
        state.initialDistance = 0
        return
      }

      // Handle double tap
      if (handlers.onDoubleTap && deltaTime < 200) {
        const timeSinceLastTap = Date.now() - state.lastTap
        if (timeSinceLastTap < configRef.current.doubleTapDelay) {
          const target = e.target as HTMLElement
          handlers.onDoubleTap(target)
          announceToScreenReader('Double tap detected')

          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 50, 50])
          }
          return
        }
        state.lastTap = Date.now()
      }

      // Handle swipe gestures
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX > threshold || absY > threshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            handlers.onSwipeRight?.()
            announceToScreenReader('Swiped right')
          } else {
            handlers.onSwipeLeft?.()
            announceToScreenReader('Swiped left')
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            handlers.onSwipeDown?.()
            announceToScreenReader('Swiped down')
          } else {
            handlers.onSwipeUp?.()
            announceToScreenReader('Swiped up')
          }
        }

        // Haptic feedback for swipes
        if ('vibrate' in navigator) {
          navigator.vibrate(30)
        }
      }
    },
    [handlers]
  )

  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const state = gestureStateRef.current
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer)
      }
    }
  }, [])

  return {
    isEnabled: configRef.current.enabled,
    config: configRef.current,
  }
}

// Keyboard navigation hook for alternative input
export function useKeyboardNavigation(handlers: {
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onTab?: (shiftKey: boolean) => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          handlers.onArrowKey?.('up')
          announceToScreenReader('Navigated up')
          break
        case 'ArrowDown':
          e.preventDefault()
          handlers.onArrowKey?.('down')
          announceToScreenReader('Navigated down')
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlers.onArrowKey?.('left')
          announceToScreenReader('Navigated left')
          break
        case 'ArrowRight':
          e.preventDefault()
          handlers.onArrowKey?.('right')
          announceToScreenReader('Navigated right')
          break
        case 'Enter':
          handlers.onEnter?.()
          break
        case ' ':
          e.preventDefault()
          handlers.onSpace?.()
          break
        case 'Escape':
          handlers.onEscape?.()
          break
        case 'Tab':
          handlers.onTab?.(e.shiftKey)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}

// Focus management for accessibility
export function useFocusManagement() {
  const focusHistoryRef = useRef<HTMLElement[]>([])

  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      focusHistoryRef.current.push(activeElement)
    }
  }, [])

  const restoreFocus = useCallback(() => {
    const lastFocused = focusHistoryRef.current.pop()
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus()
      announceToScreenReader('Focus restored')
    }
  }, [])

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    if (firstElement) {
      firstElement.focus()
      announceToScreenReader('Focused on first interactive element')
    }
  }, [])

  const focusLast = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    if (lastElement) {
      lastElement.focus()
      announceToScreenReader('Focused on last interactive element')
    }
  }, [])

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
  }
}
