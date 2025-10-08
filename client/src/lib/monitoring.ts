/**
 * Monitoring and error tracking setup with Sentry and performance monitoring
 */

import * as Sentry from '@sentry/react'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
import type { Metric } from 'web-vitals'

/**
 * Initialize Sentry error tracking
 */
export function initializeSentry() {
  if (process.env.NODE_ENV === 'production' && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new Sentry.BrowserTracing({
          // Set sampling rate for performance monitoring
          tracePropagationTargets: ['localhost', /^https:\/\/yourapi\.domain\.com\/api/],
        }),
        new Sentry.Replay({
          // Capture replays for errors
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',

      // Error filtering
      beforeSend(event, hint) {
        // Filter out known non-critical errors
        const error = hint.originalException

        if (error instanceof Error) {
          // Ignore network errors that are expected
          if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
            return null
          }

          // Ignore ResizeObserver errors (common browser quirk)
          if (error.message.includes('ResizeObserver')) {
            return null
          }
        }

        return event
      },

      // Performance filtering
      beforeSendTransaction(event) {
        // Sample transactions based on performance impact
        if (event.transaction === 'idle' || event.transaction === 'navigation') {
          return Math.random() < 0.1 ? event : null
        }

        return event
      },
    })

    // Set user context when available
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId')
      if (userId) {
        Sentry.setUser({ id: userId })
      }
    }
  }
}

/**
 * Web Vitals monitoring and reporting
 */
export function initializeWebVitals() {
  // Send Web Vitals to analytics
  function sendToAnalytics(metric: Metric) {
    // Send to Sentry
    if (process.env.NODE_ENV === 'production') {
      Sentry.addBreadcrumb({
        category: 'web-vitals',
        message: `${metric.name}: ${metric.value}`,
        level: 'info',
        data: {
          name: metric.name,
          value: metric.value,
          rating: getMetricRating(metric.name, metric.value),
          id: metric.id,
          delta: metric.delta,
        },
      })
    }

    // Send to custom analytics endpoint
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'web-vitals',
          metric: {
            name: metric.name,
            value: metric.value,
            rating: getMetricRating(metric.name, metric.value),
            id: metric.id,
            delta: metric.delta,
          },
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {
        // Silently fail analytics
      })
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vital - ${metric.name}:`, {
        value: metric.value,
        rating: getMetricRating(metric.name, metric.value),
        id: metric.id,
      })
    }
  }

  // Initialize Web Vitals collection
  getCLS(sendToAnalytics)
  getFID(sendToAnalytics)
  getFCP(sendToAnalytics)
  getLCP(sendToAnalytics)
  getTTFB(sendToAnalytics)
}

/**
 * Get performance rating for Web Vitals metrics
 */
function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
    default:
      return 'good'
  }
}

/**
 * Custom error tracking utilities
 */
export class ErrorTracker {
  private errorCounts = new Map<string, number>()
  private maxErrorsPerType = 10

  /**
   * Track and report custom errors
   */
  trackError(error: Error, context?: Record<string, any>) {
    const errorKey = `${error.name}:${error.message}`
    const currentCount = this.errorCounts.get(errorKey) || 0

    // Prevent spam of the same error
    if (currentCount >= this.maxErrorsPerType) {
      return
    }

    this.errorCounts.set(errorKey, currentCount + 1)

    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
      tags: {
        errorCount: currentCount + 1,
      },
    })

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Tracked Error:', error, context)
    }
  }

  /**
   * Track game-specific errors
   */
  trackGameError(
    error: Error,
    gameContext: {
      gameId?: string
      moveNumber?: number
      boardState?: any
      playerRole?: string
    }
  ) {
    this.trackError(error, {
      category: 'game',
      ...gameContext,
    })
  }

  /**
   * Track network errors
   */
  trackNetworkError(
    error: Error,
    requestContext: {
      url: string
      method: string
      status?: number
      responseTime?: number
    }
  ) {
    this.trackError(error, {
      category: 'network',
      ...requestContext,
    })
  }

  /**
   * Track performance issues
   */
  trackPerformanceIssue(issue: {
    type: 'slow-render' | 'memory-leak' | 'large-bundle' | 'slow-network'
    value: number
    threshold: number
    context?: Record<string, any>
  }) {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `Performance issue: ${issue.type}`,
      level: 'warning',
      data: issue,
    })

    if (process.env.NODE_ENV === 'development') {
      console.warn('Performance Issue:', issue)
    }
  }

  /**
   * Clear error counts (useful for testing)
   */
  clearErrorCounts() {
    this.errorCounts.clear()
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private performanceEntries: PerformanceEntry[] = []
  private observer: PerformanceObserver | null = null

  constructor() {
    this.initializePerformanceObserver()
  }

  private initializePerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver(list => {
          const entries = list.getEntries()
          this.performanceEntries.push(...entries)

          // Check for performance issues
          entries.forEach(entry => {
            this.checkPerformanceThresholds(entry)
          })
        })

        // Observe different types of performance entries
        this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'paint'] })
      } catch (error) {
        console.warn('Performance Observer not supported:', error)
      }
    }
  }

  private checkPerformanceThresholds(entry: PerformanceEntry) {
    const errorTracker = new ErrorTracker()

    // Check for slow resources
    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming
      const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart

      if (loadTime > 3000) {
        // 3 seconds
        errorTracker.trackPerformanceIssue({
          type: 'slow-network',
          value: loadTime,
          threshold: 3000,
          context: {
            resource: resourceEntry.name,
            size: resourceEntry.transferSize,
          },
        })
      }
    }

    // Check for slow navigation
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming
      const loadTime = navEntry.loadEventEnd - navEntry.navigationStart

      if (loadTime > 5000) {
        // 5 seconds
        errorTracker.trackPerformanceIssue({
          type: 'slow-render',
          value: loadTime,
          threshold: 5000,
          context: {
            type: 'navigation',
            redirectCount: navEntry.redirectCount,
          },
        })
      }
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    return {
      navigation: {
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart,
        loadComplete: navigation?.loadEventEnd - navigation?.navigationStart,
        firstByte: navigation?.responseStart - navigation?.requestStart,
      },
      resources: {
        count: resources.length,
        totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        slowResources: resources.filter(r => r.responseEnd - r.requestStart > 1000).length,
      },
    }
  }

  /**
   * Measure custom performance
   */
  measurePerformance(name: string, fn: () => void | Promise<void>) {
    const startMark = `${name}-start`
    const endMark = `${name}-end`
    const measureName = `${name}-duration`

    performance.mark(startMark)

    const result = fn()

    if (result instanceof Promise) {
      return result.finally(() => {
        performance.mark(endMark)
        performance.measure(measureName, startMark, endMark)
      })
    } else {
      performance.mark(endMark)
      performance.measure(measureName, startMark, endMark)
      return result
    }
  }

  /**
   * Clean up
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

/**
 * Global instances
 */
export const errorTracker = new ErrorTracker()
export const performanceMonitor = new PerformanceMonitor()

/**
 * Initialize all monitoring
 */
export function initializeMonitoring() {
  initializeSentry()
  initializeWebVitals()

  // Set up global error handlers
  window.addEventListener('error', event => {
    errorTracker.trackError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', event => {
    errorTracker.trackError(new Error(event.reason), {
      type: 'unhandled-promise-rejection',
    })
  })

  // Monitor memory usage
  if ('memory' in performance) {
    setInterval(() => {
      // @ts-ignore
      const memory = performance.memory
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit

      if (memoryUsage > 0.9) {
        // 90% memory usage
        errorTracker.trackPerformanceIssue({
          type: 'memory-leak',
          value: memoryUsage,
          threshold: 0.9,
          context: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          },
        })
      }
    }, 30000) // Check every 30 seconds
  }

  console.log('Monitoring initialized')
}
