/**
 * Performance monitoring utilities for Core Web Vitals and mobile optimization
 */

// Core Web Vitals thresholds
export const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint
  FID: 100, // First Input Delay
  CLS: 0.1, // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint
  TTFB: 800, // Time to First Byte
} as const

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

export interface WebVitalsData {
  lcp?: PerformanceMetric
  fid?: PerformanceMetric
  cls?: PerformanceMetric
  fcp?: PerformanceMetric
  ttfb?: PerformanceMetric
}

/**
 * Get performance rating based on thresholds
 */
function getPerformanceRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
    default:
      return 'good'
  }
}

/**
 * Create a performance metric object
 */
function createMetric(name: string, value: number): PerformanceMetric {
  return {
    name,
    value,
    rating: getPerformanceRating(name, value),
    timestamp: Date.now(),
  }
}

/**
 * Web Vitals monitoring class
 */
export class WebVitalsMonitor {
  private metrics: WebVitalsData = {}
  private observers: PerformanceObserver[] = []
  private onMetricCallback?: (metric: PerformanceMetric) => void

  constructor(onMetric?: (metric: PerformanceMetric) => void) {
    this.onMetricCallback = onMetric
    this.initializeObservers()
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
          if (lastEntry) {
            const metric = createMetric('LCP', lastEntry.startTime)
            this.metrics.lcp = metric
            this.onMetricCallback?.(metric)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            const metric = createMetric('FID', entry.processingStart - entry.startTime)
            this.metrics.fid = metric
            this.onMetricCallback?.(metric)
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('FID observer not supported')
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          const metric = createMetric('CLS', clsValue)
          this.metrics.cls = metric
          this.onMetricCallback?.(metric)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported')
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              const metric = createMetric('FCP', entry.startTime)
              this.metrics.fcp = metric
              this.onMetricCallback?.(metric)
            }
          })
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(fcpObserver)
      } catch (e) {
        console.warn('FCP observer not supported')
      }
    }

    // Time to First Byte (TTFB)
    this.measureTTFB()
  }

  private measureTTFB() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[]
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0]
        const ttfb = entry.responseStart - entry.requestStart
        const metric = createMetric('TTFB', ttfb)
        this.metrics.ttfb = metric
        this.onMetricCallback?.(metric)
      }
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): WebVitalsData {
    return { ...this.metrics }
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const metrics = Object.values(this.metrics)
    if (metrics.length === 0) return 0

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good':
          return 100
        case 'needs-improvement':
          return 50
        case 'poor':
          return 0
        default:
          return 0
      }
    })

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }

  /**
   * Clean up observers
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

/**
 * Mobile-specific performance utilities
 */
export class MobilePerformanceMonitor {
  private connectionInfo: any = null
  private memoryInfo: any = null

  constructor() {
    this.initializeConnectionMonitoring()
    this.initializeMemoryMonitoring()
  }

  private initializeConnectionMonitoring() {
    // @ts-ignore - Navigator connection API
    if (
      'connection' in navigator ||
      'mozConnection' in navigator ||
      'webkitConnection' in navigator
    ) {
      // @ts-ignore
      this.connectionInfo =
        navigator.connection || navigator.mozConnection || navigator.webkitConnection
    }
  }

  private initializeMemoryMonitoring() {
    // @ts-ignore - Performance memory API
    if ('memory' in performance) {
      // @ts-ignore
      this.memoryInfo = performance.memory
    }
  }

  /**
   * Get network connection information
   */
  getConnectionInfo() {
    if (!this.connectionInfo) return null

    return {
      effectiveType: this.connectionInfo.effectiveType,
      downlink: this.connectionInfo.downlink,
      rtt: this.connectionInfo.rtt,
      saveData: this.connectionInfo.saveData,
    }
  }

  /**
   * Get memory usage information
   */
  getMemoryInfo() {
    if (!this.memoryInfo) return null

    return {
      usedJSHeapSize: this.memoryInfo.usedJSHeapSize,
      totalJSHeapSize: this.memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: this.memoryInfo.jsHeapSizeLimit,
      memoryPressure: this.memoryInfo.usedJSHeapSize / this.memoryInfo.jsHeapSizeLimit,
    }
  }

  /**
   * Check if device is on a slow connection
   */
  isSlowConnection(): boolean {
    const connection = this.getConnectionInfo()
    if (!connection) return false

    return (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.saveData === true ||
      connection.downlink < 1.5
    )
  }

  /**
   * Check if device has memory pressure
   */
  hasMemoryPressure(): boolean {
    const memory = this.getMemoryInfo()
    if (!memory) return false

    return memory.memoryPressure > 0.8 // 80% memory usage
  }

  /**
   * Get device performance tier
   */
  getDevicePerformanceTier(): 'high' | 'medium' | 'low' {
    const memory = this.getMemoryInfo()
    const connection = this.getConnectionInfo()

    // High-end device indicators
    if (memory && memory.jsHeapSizeLimit > 1000000000) {
      // > 1GB heap
      return 'high'
    }

    // Low-end device indicators
    if (
      this.isSlowConnection() ||
      this.hasMemoryPressure() ||
      (memory && memory.jsHeapSizeLimit < 500000000) // < 500MB heap
    ) {
      return 'low'
    }

    return 'medium'
  }
}

/**
 * Performance optimization recommendations
 */
export function getPerformanceRecommendations(
  webVitals: WebVitalsData,
  mobileMonitor: MobilePerformanceMonitor
): string[] {
  const recommendations: string[] = []

  // LCP recommendations
  if (webVitals.lcp && webVitals.lcp.rating !== 'good') {
    recommendations.push('Optimize images and reduce server response times to improve LCP')
  }

  // FID recommendations
  if (webVitals.fid && webVitals.fid.rating !== 'good') {
    recommendations.push('Reduce JavaScript execution time and break up long tasks')
  }

  // CLS recommendations
  if (webVitals.cls && webVitals.cls.rating !== 'good') {
    recommendations.push(
      'Add size attributes to images and avoid inserting content above existing content'
    )
  }

  // Mobile-specific recommendations
  if (mobileMonitor.isSlowConnection()) {
    recommendations.push('Enable data saver mode and reduce image quality for slow connections')
  }

  if (mobileMonitor.hasMemoryPressure()) {
    recommendations.push('Reduce memory usage by lazy loading components and clearing unused data')
  }

  const deviceTier = mobileMonitor.getDevicePerformanceTier()
  if (deviceTier === 'low') {
    recommendations.push('Reduce animations and visual effects for low-end devices')
  }

  return recommendations
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(onMetric?: (metric: PerformanceMetric) => void): {
  webVitals: WebVitalsMonitor
  mobile: MobilePerformanceMonitor
} {
  const webVitals = new WebVitalsMonitor(onMetric)
  const mobile = new MobilePerformanceMonitor()

  // Log performance data in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      console.group('Performance Metrics')
      console.log('Web Vitals:', webVitals.getMetrics())
      console.log('Performance Score:', webVitals.getPerformanceScore())
      console.log('Connection Info:', mobile.getConnectionInfo())
      console.log('Memory Info:', mobile.getMemoryInfo())
      console.log('Device Tier:', mobile.getDevicePerformanceTier())
      console.log('Recommendations:', getPerformanceRecommendations(webVitals.getMetrics(), mobile))
      console.groupEnd()
    }, 3000)
  }

  return { webVitals, mobile }
}
