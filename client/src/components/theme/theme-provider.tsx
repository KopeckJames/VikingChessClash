import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'
type ContrastMode = 'normal' | 'high'
type MotionPreference = 'normal' | 'reduced'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  contrastMode: ContrastMode
  motionPreference: MotionPreference
  setTheme: (theme: Theme) => void
  setContrastMode: (mode: ContrastMode) => void
  setMotionPreference: (preference: MotionPreference) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  contrastMode: 'normal',
  motionPreference: 'normal',
  setTheme: () => null,
  setContrastMode: () => null,
  setMotionPreference: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  const [contrastMode, setContrastMode] = useState<ContrastMode>(
    () => (localStorage.getItem(`${storageKey}-contrast`) as ContrastMode) || 'normal'
  )

  const [motionPreference, setMotionPreference] = useState<MotionPreference>(
    () => (localStorage.getItem(`${storageKey}-motion`) as MotionPreference) || 'normal'
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  // Handle contrast mode
  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('high-contrast')

    if (contrastMode === 'high') {
      root.classList.add('high-contrast')
    }

    // Also check system preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (contrastMode === 'normal' && e.matches) {
        root.classList.add('high-contrast')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Initial check
    if (contrastMode === 'normal' && mediaQuery.matches) {
      root.classList.add('high-contrast')
    }

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [contrastMode])

  // Handle motion preference
  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('reduce-motion')

    if (motionPreference === 'reduced') {
      root.classList.add('reduce-motion')
    }

    // Also check system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (motionPreference === 'normal' && e.matches) {
        root.classList.add('reduce-motion')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Initial check
    if (motionPreference === 'normal' && mediaQuery.matches) {
      root.classList.add('reduce-motion')
    }

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [motionPreference])

  const value = {
    theme,
    contrastMode,
    motionPreference,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    setContrastMode: (mode: ContrastMode) => {
      localStorage.setItem(`${storageKey}-contrast`, mode)
      setContrastMode(mode)
    },
    setMotionPreference: (preference: MotionPreference) => {
      localStorage.setItem(`${storageKey}-motion`, preference)
      setMotionPreference(preference)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

// Theme toggle component with accessibility
interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const handleToggle = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light theme active. Click to switch to dark theme.'
      case 'dark':
        return 'Dark theme active. Click to switch to system theme.'
      case 'system':
        return 'System theme active. Click to switch to light theme.'
      default:
        return 'Toggle theme'
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'system':
        return '💻'
      default:
        return '🎨'
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium 
        ring-offset-background transition-colors focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50 hover:bg-accent 
        hover:text-accent-foreground h-11 w-11 min-h-11 min-w-11
        ${className}
      `}
      aria-label={getThemeLabel()}
      title={getThemeLabel()}
    >
      <span className="text-lg" role="img" aria-hidden="true">
        {getThemeIcon()}
      </span>
      <span className="sr-only">{getThemeLabel()}</span>
    </button>
  )
}

// Accessibility settings component
export function AccessibilitySettings() {
  const { contrastMode, setContrastMode, motionPreference, setMotionPreference } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Accessibility Preferences</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize the interface to meet your accessibility needs.
        </p>
      </div>

      {/* Contrast Mode */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Contrast Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setContrastMode('normal')}
            className={`
              px-3 py-2 text-sm rounded-md border transition-colors
              ${
                contrastMode === 'normal'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              }
            `}
            aria-pressed={contrastMode === 'normal'}
          >
            Normal Contrast
          </button>
          <button
            onClick={() => setContrastMode('high')}
            className={`
              px-3 py-2 text-sm rounded-md border transition-colors
              ${
                contrastMode === 'high'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              }
            `}
            aria-pressed={contrastMode === 'high'}
          >
            High Contrast
          </button>
        </div>
      </div>

      {/* Motion Preference */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Animation Preference</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMotionPreference('normal')}
            className={`
              px-3 py-2 text-sm rounded-md border transition-colors
              ${
                motionPreference === 'normal'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              }
            `}
            aria-pressed={motionPreference === 'normal'}
          >
            Normal Motion
          </button>
          <button
            onClick={() => setMotionPreference('reduced')}
            className={`
              px-3 py-2 text-sm rounded-md border transition-colors
              ${
                motionPreference === 'reduced'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              }
            `}
            aria-pressed={motionPreference === 'reduced'}
          >
            Reduced Motion
          </button>
        </div>
      </div>
    </div>
  )
}
