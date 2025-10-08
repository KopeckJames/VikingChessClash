/**
 * Accessibility utilities for Viking Chess application
 * Ensures WCAG 2.1 AA compliance and enhanced user experience
 */

// Screen reader announcements
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.setAttribute('class', 'sr-only')
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Focus management
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const firstFocusable = focusableElements[0] as HTMLElement
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  }

  element.addEventListener('keydown', handleTabKey)

  // Focus first element
  firstFocusable?.focus()

  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

// Keyboard navigation helpers
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  TAB: 'Tab',
} as const

export function handleKeyboardNavigation(
  event: KeyboardEvent,
  handlers: Partial<Record<keyof typeof KEYBOARD_KEYS, () => void>>
) {
  const key = event.key
  const handler = Object.entries(KEYBOARD_KEYS).find(
    ([, value]) => value === key
  )?.[0] as keyof typeof KEYBOARD_KEYS

  if (handler && handlers[handler]) {
    event.preventDefault()
    handlers[handler]!()
  }
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd want a more robust color parsing library
  const getLuminance = (color: string): number => {
    // This is a simplified version - you'd want proper color parsing
    const rgb = color.match(/\d+/g)
    if (!rgb) return 0

    const [r, g, b] = rgb.map(x => {
      const val = parseInt(x) / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// High contrast detection
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches
}

// Generate accessible IDs
let idCounter = 0
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${++idCounter}`
}

// ARIA helpers
export function createAriaDescribedBy(descriptions: string[]): string {
  return descriptions.filter(Boolean).join(' ')
}

// Game-specific accessibility helpers
export function describeGamePiece(
  type: 'king' | 'defender' | 'attacker',
  position?: string
): string {
  const typeDescriptions = {
    king: 'King piece',
    defender: 'Defender piece',
    attacker: 'Attacker piece',
  }

  return position ? `${typeDescriptions[type]} at position ${position}` : typeDescriptions[type]
}

export function describeBoardPosition(row: number, col: number, boardSize: number = 11): string {
  const letter = String.fromCharCode(65 + col) // A, B, C, etc.
  const number = boardSize - row // 11, 10, 9, etc.
  return `${letter}${number}`
}

export function describeGameMove(from: string, to: string, piece: string): string {
  return `Move ${piece} from ${from} to ${to}`
}

// Focus restoration
export class FocusManager {
  private previousFocus: HTMLElement | null = null

  saveFocus() {
    this.previousFocus = document.activeElement as HTMLElement
  }

  restoreFocus() {
    if (this.previousFocus && document.contains(this.previousFocus)) {
      this.previousFocus.focus()
    }
  }
}

// Accessible toast/notification system
export function createAccessibleNotification(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
) {
  const notification = {
    id: generateId('notification'),
    message,
    type,
    timestamp: new Date().toISOString(),
    ariaLabel: `${type} notification: ${message}`,
  }

  // Announce to screen readers
  announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite')

  return notification
}
