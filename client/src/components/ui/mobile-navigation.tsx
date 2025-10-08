import * as React from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Menu, X, Home, Users, Trophy, User, Settings } from 'lucide-react'
import { TouchButton } from './touch-button'
import { cn } from '@/lib/utils'
import { useLocation } from 'wouter'

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navigationItems: NavigationItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Lobby', href: '/lobby', icon: Users },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [location, navigate] = useLocation()

  // Handle swipe gestures
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldClose = info.velocity.x < -500 || info.offset.x < -150
    if (shouldClose) {
      setIsOpen(false)
    }
  }

  // Close on route change
  React.useEffect(() => {
    setIsOpen(false)
  }, [location])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleNavigate = (href: string) => {
    navigate(href)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className={cn('md:hidden', className)}>
        <TouchButton
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
          className="relative"
        >
          <Menu className="h-6 w-6" />
        </TouchButton>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: -300, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] bg-background border-r shadow-xl md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Viking Chess</h2>
              <TouchButton
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-6 w-6" />
              </TouchButton>
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col p-4 space-y-2" role="navigation">
              {navigationItems.map(item => {
                const Icon = item.icon
                const isActive = location === item.href

                return (
                  <TouchButton
                    key={item.href}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'justify-start h-12 px-4 text-left',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleNavigate(item.href)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </TouchButton>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/50">
              <p className="text-xs text-muted-foreground text-center">
                Swipe left or tap outside to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Desktop Navigation Component
interface DesktopNavigationProps {
  className?: string
}

export function DesktopNavigation({ className }: DesktopNavigationProps) {
  const [location] = useLocation()

  return (
    <nav className={cn('hidden md:flex items-center space-x-1', className)} role="navigation">
      {navigationItems.map(item => {
        const Icon = item.icon
        const isActive = location === item.href

        return (
          <TouchButton
            key={item.href}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            className="relative"
            onClick={() => (window.location.href = item.href)}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.label}
            {item.badge && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {item.badge}
              </span>
            )}
          </TouchButton>
        )
      })}
    </nav>
  )
}
