import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { announceToScreenReader } from '@/lib/accessibility'

const touchButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 transition-transform duration-150 select-none touch-manipulation',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-4 py-2 min-h-11 min-w-11', // 44px minimum touch target
        sm: 'h-11 rounded-md px-3 min-h-11 min-w-11', // Still 44px for touch
        lg: 'h-12 rounded-md px-8 min-h-12', // 48px for larger touch target
        icon: 'h-11 w-11 min-h-11 min-w-11', // Square 44px touch target
        'icon-lg': 'h-12 w-12 min-h-12 min-w-12', // Square 48px touch target
        // Accessibility sizes
        accessibility: 'h-14 px-6 py-3 min-h-14 text-base',
        'accessibility-icon': 'h-14 w-14 min-h-14 min-w-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface TouchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof touchButtonVariants> {
  asChild?: boolean
  hapticFeedback?: boolean
  announceOnClick?: string
  longPressDelay?: number
  onLongPress?: () => void
}

const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      hapticFeedback = true,
      announceOnClick,
      longPressDelay = 500,
      onLongPress,
      onClick,
      onTouchStart,
      onTouchEnd,
      onMouseDown,
      onMouseUp,
      children,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = React.useState(false)
    const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null)

    // Enhanced click handler with accessibility features
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Haptic feedback
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(50)
        }

        // Screen reader announcement
        if (announceOnClick) {
          announceToScreenReader(announceOnClick)
        }

        // Call original onClick
        onClick?.(e)
      },
      [hapticFeedback, announceOnClick, onClick]
    )

    // Long press handling
    const startLongPress = React.useCallback(() => {
      if (!onLongPress) return

      longPressTimerRef.current = setTimeout(() => {
        onLongPress()
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate([50, 50, 100])
        }
      }, longPressDelay)
    }, [onLongPress, longPressDelay, hapticFeedback])

    const cancelLongPress = React.useCallback(() => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }, [])

    // Touch event handlers
    const handleTouchStart = React.useCallback(
      (e: React.TouchEvent<HTMLButtonElement>) => {
        setIsPressed(true)
        startLongPress()
        onTouchStart?.(e)
      },
      [startLongPress, onTouchStart]
    )

    const handleTouchEnd = React.useCallback(
      (e: React.TouchEvent<HTMLButtonElement>) => {
        setIsPressed(false)
        cancelLongPress()
        onTouchEnd?.(e)
      },
      [cancelLongPress, onTouchEnd]
    )

    // Mouse event handlers (for desktop)
    const handleMouseDown = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsPressed(true)
        startLongPress()
        onMouseDown?.(e)
      },
      [startLongPress, onMouseDown]
    )

    const handleMouseUp = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsPressed(false)
        cancelLongPress()
        onMouseUp?.(e)
      },
      [cancelLongPress, onMouseUp]
    )

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
        }
      }
    }, [])

    // Determine if we should use accessibility size
    const accessibilitySize = React.useMemo(() => {
      if (typeof window !== 'undefined') {
        const root = document.documentElement
        const hasLargeButtons = root.classList.contains('large-buttons')

        if (hasLargeButtons) {
          return size === 'icon' || size === 'icon-lg' ? 'accessibility-icon' : 'accessibility'
        }
      }
      return size
    }, [size])

    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(
          touchButtonVariants({ variant, size: accessibilitySize, className }),
          // High contrast mode support
          'high-contrast:border-2 high-contrast:border-current',
          // Reduced motion support
          'reduce-motion:transition-none reduce-motion:transform-none'
        )}
        ref={ref}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        // Enhanced accessibility attributes
        role="button"
        tabIndex={props.disabled ? -1 : 0}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
TouchButton.displayName = 'TouchButton'

export { TouchButton, touchButtonVariants }
