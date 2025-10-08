import { useEffect, useCallback, useRef } from 'react'
import { KEYBOARD_KEYS, handleKeyboardNavigation } from '@/lib/accessibility'

interface UseKeyboardNavigationOptions {
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onHome?: () => void
  onEnd?: () => void
  onTab?: (shiftKey: boolean) => void
  enabled?: boolean
}

export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onTab,
    enabled = true,
  } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const handlers = {
        ENTER: onEnter,
        SPACE: onSpace,
        ESCAPE: onEscape,
        ARROW_UP: onArrowUp,
        ARROW_DOWN: onArrowDown,
        ARROW_LEFT: onArrowLeft,
        ARROW_RIGHT: onArrowRight,
        HOME: onHome,
        END: onEnd,
        TAB: onTab ? () => onTab(event.shiftKey) : undefined,
      }

      handleKeyboardNavigation(event, handlers)
    },
    [
      enabled,
      onEnter,
      onSpace,
      onEscape,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onHome,
      onEnd,
      onTab,
    ]
  )

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  return { handleKeyDown }
}

// Hook for game board navigation
interface Position {
  row: number
  col: number
}

interface UseGameBoardNavigationOptions {
  boardSize: number
  currentPosition?: Position
  onPositionChange?: (position: Position) => void
  onSelect?: (position: Position) => void
  enabled?: boolean
}

export function useGameBoardNavigation({
  boardSize,
  currentPosition,
  onPositionChange,
  onSelect,
  enabled = true,
}: UseGameBoardNavigationOptions) {
  const currentPos = useRef<Position>(currentPosition || { row: 0, col: 0 })

  const movePosition = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const { row, col } = currentPos.current
      let newRow = row
      let newCol = col

      switch (direction) {
        case 'up':
          newRow = Math.max(0, row - 1)
          break
        case 'down':
          newRow = Math.min(boardSize - 1, row + 1)
          break
        case 'left':
          newCol = Math.max(0, col - 1)
          break
        case 'right':
          newCol = Math.min(boardSize - 1, col + 1)
          break
      }

      const newPosition = { row: newRow, col: newCol }
      currentPos.current = newPosition
      onPositionChange?.(newPosition)
    },
    [boardSize, onPositionChange]
  )

  const selectPosition = useCallback(() => {
    onSelect?.(currentPos.current)
  }, [onSelect])

  const goToCorner = useCallback(
    (corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
      let newPosition: Position

      switch (corner) {
        case 'top-left':
          newPosition = { row: 0, col: 0 }
          break
        case 'top-right':
          newPosition = { row: 0, col: boardSize - 1 }
          break
        case 'bottom-left':
          newPosition = { row: boardSize - 1, col: 0 }
          break
        case 'bottom-right':
          newPosition = { row: boardSize - 1, col: boardSize - 1 }
          break
      }

      currentPos.current = newPosition
      onPositionChange?.(newPosition)
    },
    [boardSize, onPositionChange]
  )

  useKeyboardNavigation({
    onArrowUp: () => movePosition('up'),
    onArrowDown: () => movePosition('down'),
    onArrowLeft: () => movePosition('left'),
    onArrowRight: () => movePosition('right'),
    onEnter: selectPosition,
    onSpace: selectPosition,
    onHome: () => goToCorner('top-left'),
    onEnd: () => goToCorner('bottom-right'),
    enabled,
  })

  // Update current position when prop changes
  useEffect(() => {
    if (currentPosition) {
      currentPos.current = currentPosition
    }
  }, [currentPosition])

  return {
    currentPosition: currentPos.current,
    movePosition,
    selectPosition,
    goToCorner,
  }
}

// Hook for modal/dialog keyboard navigation
interface UseModalNavigationOptions {
  isOpen: boolean
  onClose?: () => void
  trapFocus?: boolean
}

export function useModalNavigation({
  isOpen,
  onClose,
  trapFocus = true,
}: UseModalNavigationOptions) {
  const modalRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useKeyboardNavigation({
    onEscape: onClose,
    enabled: isOpen,
  })

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement

      // Focus first focusable element in modal
      if (modalRef.current && trapFocus) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstFocusable = focusableElements[0] as HTMLElement
        firstFocusable?.focus()
      }
    } else {
      // Restore previous focus
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, trapFocus])

  return { modalRef }
}
