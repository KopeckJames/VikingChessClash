import { lazy, ComponentType, LazyExoticComponent } from 'react'

/**
 * Enhanced lazy loading with error boundaries and loading states
 */
export interface LazyComponentOptions {
  fallback?: ComponentType
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>
  preload?: boolean
  timeout?: number
}

/**
 * Create a lazy component with enhanced error handling
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> {
  const {
    timeout = 10000, // 10 second timeout
  } = options

  // Add timeout to import function
  const timeoutImport = () => {
    return Promise.race([
      importFn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Component load timeout')), timeout)
      }),
    ])
  }

  return lazy(timeoutImport)
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
): Promise<void> {
  // @ts-ignore - Access internal preload method
  if (lazyComponent._payload && lazyComponent._payload._status === -1) {
    // @ts-ignore
    return lazyComponent._payload._result()
  }
  return Promise.resolve()
}

/**
 * Route-based code splitting configuration
 */
export const LazyRoutes = {
  // Authentication pages
  Auth: createLazyComponent(() => import('@/pages/auth'), {
    preload: false,
  }),

  ForgotPassword: createLazyComponent(() => import('@/pages/auth/forgot-password'), {
    preload: false,
  }),

  ResetPassword: createLazyComponent(() => import('@/pages/auth/reset-password'), {
    preload: false,
  }),

  VerifyEmail: createLazyComponent(() => import('@/pages/auth/verify-email'), {
    preload: false,
  }),

  // Game pages
  Game: createLazyComponent(() => import('@/pages/game'), {
    preload: true, // Preload game page as it's commonly accessed
  }),

  GameSimple: createLazyComponent(() => import('@/pages/game-simple'), {
    preload: false,
  }),

  GameFixed: createLazyComponent(() => import('@/pages/game-fixed'), {
    preload: false,
  }),

  // Feature pages
  Lobby: createLazyComponent(() => import('@/pages/lobby'), {
    preload: true, // Preload lobby as it's the main entry point
  }),

  Leaderboard: createLazyComponent(() => import('@/pages/leaderboard'), {
    preload: false,
  }),

  Profile: createLazyComponent(() => import('@/pages/profile'), {
    preload: false,
  }),

  Tournaments: createLazyComponent(() => import('@/pages/tournaments'), {
    preload: false,
  }),

  Learning: createLazyComponent(() => import('@/pages/learning'), {
    preload: false,
  }),

  Offline: createLazyComponent(() => import('@/pages/offline'), {
    preload: false,
  }),

  // Error pages
  NotFound: createLazyComponent(() => import('@/pages/not-found'), {
    preload: false,
  }),
}

/**
 * Component-based code splitting
 */
export const LazyComponents = {
  // Game components
  GameBoard: createLazyComponent(() => import('@/components/game-board'), {
    preload: true,
  }),

  TouchOptimizedGameBoard: createLazyComponent(
    () => import('@/components/touch-optimized-game-board'),
    {
      preload: true,
    }
  ),

  GameAnalysis: createLazyComponent(() => import('@/components/game-analysis'), {
    preload: false,
  }),

  GameReplay: createLazyComponent(() => import('@/components/game-replay'), {
    preload: false,
  }),

  // Feature components
  Chat: createLazyComponent(() => import('@/components/chat'), {
    preload: false,
  }),

  MobileChat: createLazyComponent(() => import('@/components/mobile-chat'), {
    preload: false,
  }),

  TournamentBracket: createLazyComponent(() => import('@/components/tournament-bracket'), {
    preload: false,
  }),

  TournamentRegistration: createLazyComponent(
    () => import('@/components/tournament-registration'),
    {
      preload: false,
    }
  ),

  AnalyticsDashboard: createLazyComponent(() => import('@/components/analytics-dashboard'), {
    preload: false,
  }),

  RatingChart: createLazyComponent(() => import('@/components/rating-chart'), {
    preload: false,
  }),

  // Learning components
  TutorialSystem: createLazyComponent(() => import('@/components/tutorial-system'), {
    preload: false,
  }),

  StrategyGuides: createLazyComponent(() => import('@/components/strategy-guides'), {
    preload: false,
  }),

  HintsSystem: createLazyComponent(() => import('@/components/hints-system'), {
    preload: false,
  }),

  // AI components
  AIOpponentSelector: createLazyComponent(() => import('@/components/ai-opponent-selector'), {
    preload: false,
  }),
}

/**
 * Preload critical components based on route
 */
export function preloadCriticalComponents(route: string): Promise<void[]> {
  const preloadPromises: Promise<void>[] = []

  switch (route) {
    case '/':
    case '/lobby':
      preloadPromises.push(
        preloadComponent(LazyRoutes.Lobby),
        preloadComponent(LazyComponents.GameBoard)
      )
      break

    case '/game':
      preloadPromises.push(
        preloadComponent(LazyRoutes.Game),
        preloadComponent(LazyComponents.GameBoard),
        preloadComponent(LazyComponents.TouchOptimizedGameBoard)
      )
      break

    case '/auth':
      preloadPromises.push(preloadComponent(LazyRoutes.Auth))
      break

    default:
      // Preload common components
      preloadPromises.push(preloadComponent(LazyComponents.GameBoard))
  }

  return Promise.all(preloadPromises)
}

/**
 * Preload components on user interaction
 */
export function preloadOnHover(
  componentName: keyof typeof LazyComponents | keyof typeof LazyRoutes
) {
  return {
    onMouseEnter: () => {
      if (componentName in LazyComponents) {
        preloadComponent(LazyComponents[componentName as keyof typeof LazyComponents])
      } else if (componentName in LazyRoutes) {
        preloadComponent(LazyRoutes[componentName as keyof typeof LazyRoutes])
      }
    },
  }
}

/**
 * Bundle analyzer helper for development
 */
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    if (window.__BUNDLE_ANALYZER__) {
      console.group('Bundle Analysis')
      console.log('Lazy Routes:', Object.keys(LazyRoutes))
      console.log('Lazy Components:', Object.keys(LazyComponents))
      console.groupEnd()
    }
  }
}

/**
 * Dynamic import with retry logic
 */
export function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft: number) => {
      importFn()
        .then(resolve)
        .catch(error => {
          if (retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), delay)
          } else {
            reject(error)
          }
        })
    }

    attempt(retries)
  })
}

/**
 * Prefetch resources based on user behavior
 */
export class ResourcePrefetcher {
  private prefetchedUrls = new Set<string>()
  private intersectionObserver: IntersectionObserver | null = null

  constructor() {
    this.initializeIntersectionObserver()
  }

  private initializeIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement
              const prefetchUrl = element.dataset.prefetch

              if (prefetchUrl && !this.prefetchedUrls.has(prefetchUrl)) {
                this.prefetchResource(prefetchUrl)
                this.prefetchedUrls.add(prefetchUrl)
              }
            }
          })
        },
        { rootMargin: '100px 0px' }
      )
    }
  }

  observeElement(element: HTMLElement, prefetchUrl: string) {
    if (this.intersectionObserver) {
      element.dataset.prefetch = prefetchUrl
      this.intersectionObserver.observe(element)
    }
  }

  private prefetchResource(url: string) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  }

  prefetchRoute(route: string) {
    if (!this.prefetchedUrls.has(route)) {
      this.prefetchResource(route)
      this.prefetchedUrls.add(route)
    }
  }

  disconnect() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
  }
}

/**
 * Global resource prefetcher instance
 */
export const resourcePrefetcher = new ResourcePrefetcher()
