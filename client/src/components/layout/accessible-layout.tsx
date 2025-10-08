import * as React from 'react'
import { cn } from '@/lib/utils'
import { MobileNavigation, DesktopNavigation } from '@/components/ui/mobile-navigation'
import { TouchButton } from '@/components/ui/touch-button'
import { Settings, User } from 'lucide-react'

interface AccessibleLayoutProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}

export function AccessibleLayout({
  children,
  className,
  title = 'Viking Chess',
  description = 'Play the ancient Norse strategy game online',
}: AccessibleLayoutProps) {
  const skipToContentRef = React.useRef<HTMLAnchorElement>(null)
  const mainContentRef = React.useRef<HTMLMainElement>(null)

  const handleSkipToContent = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      mainContentRef.current?.focus()
    }
  }

  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      {/* Skip to content link for screen readers */}
      <a
        ref={skipToContentRef}
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
        onKeyDown={handleSkipToContent}
      >
        Skip to main content
      </a>

      {/* Header with navigation */}
      <header
        className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
      >
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">
              <a
                href="/"
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                aria-label="Viking Chess - Go to homepage"
              >
                {title}
              </a>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <DesktopNavigation />

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <TouchButton
              variant="ghost"
              size="icon"
              aria-label="User profile"
              className="hidden sm:inline-flex"
            >
              <User className="h-5 w-5" />
            </TouchButton>

            <TouchButton
              variant="ghost"
              size="icon"
              aria-label="Settings"
              className="hidden sm:inline-flex"
            >
              <Settings className="h-5 w-5" />
            </TouchButton>

            {/* Mobile Navigation */}
            <MobileNavigation />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main
        ref={mainContentRef}
        id="main-content"
        className="flex-1 focus:outline-none"
        role="main"
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-6 md:py-8" role="contentinfo">
        <div className="container px-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {/* Game Info */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Game</h3>
              <nav aria-label="Game navigation">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="/rules"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      How to Play
                    </a>
                  </li>
                  <li>
                    <a
                      href="/tutorial"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Tutorial
                    </a>
                  </li>
                  <li>
                    <a
                      href="/strategy"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Strategy Guide
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Community</h3>
              <nav aria-label="Community navigation">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="/tournaments"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Tournaments
                    </a>
                  </li>
                  <li>
                    <a
                      href="/forums"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Forums
                    </a>
                  </li>
                  <li>
                    <a
                      href="/discord"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Discord
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Support</h3>
              <nav aria-label="Support navigation">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="/help"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a
                      href="/contact"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="/accessibility"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Accessibility
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Legal</h3>
              <nav aria-label="Legal navigation">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="/privacy"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="/cookies"
                      className="hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                    >
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>© 2024 Viking Chess. Built with accessibility in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
