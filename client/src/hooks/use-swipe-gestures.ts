import { useEffect, useRef, useCallback } from 'react'

interface SwipeGestureOptions {
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  preventScroll?: boolean
}

interface TouchPoint {
  x: number
  y: number
  time: number
}

export function useSwipeGestures(options: SwipeGestureOptions = {}) {
  const {
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    preventScroll = false,
  } = options

  const touchStartRef = useRef<TouchPoint | null>(null)
  const touchEndRef = useRef<TouchPoint | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
    touchEndRef.current = null
  }, [])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (preventScroll && touchStartRef.current) {
        const touch = e.touches[0]
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)

        // Prevent scroll if vertical swipe is detected
        if (deltaY > deltaX && deltaY > 10) {
          e.preventDefault()
        }
      }
    },
    [preventScroll]
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }

      const deltaX = touchEndRef.current.x - touchStartRef.current.x
      const deltaY = touchEndRef.current.y - touchStartRef.current.y
      const deltaTime = touchEndRef.current.time - touchStartRef.current.time

      // Calculate distance and velocity
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = distance / deltaTime

      // Only trigger swipe if distance is above threshold and velocity is reasonable
      if (distance < threshold || velocity < 0.1) return

      // Determine swipe direction
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.()
        } else {
          onSwipeUp?.()
        }
      }

      // Reset touch points
      touchStartRef.current = null
      touchEndRef.current = null
    },
    [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, threshold]
  )

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    ref: elementRef,
    isSwipeActive: touchStartRef.current !== null,
  }
}

// Hook for chat-specific swipe gestures
export function useChatSwipeGestures(onClose: () => void, onMinimize?: () => void) {
  return useSwipeGestures({
    onSwipeDown: onClose,
    onSwipeUp: onMinimize,
    threshold: 80,
    preventScroll: true,
  })
}

// Hook for message-specific swipe gestures (reply, delete, etc.)
export function useMessageSwipeGestures(
  onReply?: () => void,
  onDelete?: () => void,
  onReact?: () => void
) {
  return useSwipeGestures({
    onSwipeLeft: onReply,
    onSwipeRight: onReact,
    threshold: 60,
    preventScroll: false,
  })
}
