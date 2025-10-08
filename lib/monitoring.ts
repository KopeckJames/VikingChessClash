import * as Sentry from '@sentry/nextjs'

// Initialize Sentry for error tracking
export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: undefined }),
      ],
      beforeSend(event) {
        // Filter out non-critical errors in production
        if (process.env.NODE_ENV === 'production') {
          if (event.exception) {
            const error = event.exception.values?.[0]
            if (error?.type === 'ChunkLoadError' || error?.type === 'NetworkError') {
              return null // Don't send chunk load errors
            }
          }
        }
        return event
      },
    })
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static startTimer(label: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  static recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    const values = this.metrics.get(label)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  static getMetrics(
    label: string
  ): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) return null

    const sum = values.reduce((a, b) => a + b, 0)
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }
  }

  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [label, values] of this.metrics.entries()) {
      if (values.length > 0) {
        result[label] = this.getMetrics(label)
      }
    }
    return result
  }
}

// Health check endpoint data
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  services: {
    database: 'healthy' | 'unhealthy'
    redis: 'healthy' | 'unhealthy'
    websocket: 'healthy' | 'unhealthy'
  }
  metrics: {
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu: {
      usage: number
    }
    requests: {
      total: number
      errors: number
      errorRate: number
    }
  }
}

export class HealthChecker {
  private static requestCount = 0
  private static errorCount = 0
  private static startTime = Date.now()

  static incrementRequests(): void {
    this.requestCount++
  }

  static incrementErrors(): void {
    this.errorCount++
  }

  static async checkDatabase(): Promise<boolean> {
    try {
      // This would be replaced with actual database health check
      // For now, we'll assume it's healthy if DATABASE_URL is set
      return !!process.env.DATABASE_URL
    } catch {
      return false
    }
  }

  static async checkRedis(): Promise<boolean> {
    try {
      // This would be replaced with actual Redis health check
      return !!process.env.UPSTASH_REDIS_REST_URL
    } catch {
      return false
    }
  }

  static async getHealthStatus(): Promise<HealthCheckResult> {
    const [dbHealthy, redisHealthy] = await Promise.all([this.checkDatabase(), this.checkRedis()])

    const memoryUsage = process.memoryUsage()
    const uptime = Date.now() - this.startTime
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    if (!dbHealthy || !redisHealthy) {
      status = 'unhealthy'
    } else if (errorRate > 0.1 || memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      status = 'degraded'
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
        websocket: 'healthy', // Assume healthy for now
      },
      metrics: {
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        },
        cpu: {
          usage: process.cpuUsage().user / 1000000, // Convert to seconds
        },
        requests: {
          total: this.requestCount,
          errors: this.errorCount,
          errorRate,
        },
      },
    }
  }
}

// Alert system
export class AlertManager {
  static async sendAlert(
    level: 'info' | 'warning' | 'error' | 'critical',
    message: string,
    context?: any
  ): Promise<void> {
    // Log to Sentry
    if (level === 'error' || level === 'critical') {
      Sentry.captureException(new Error(message), {
        level: level === 'critical' ? 'fatal' : 'error',
        extra: context,
      })
    }

    // Log to console
    console.log(`[${level.toUpperCase()}] ${message}`, context)

    // In production, you might want to send to external alerting services
    if (process.env.NODE_ENV === 'production' && process.env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            message,
            context,
            timestamp: new Date().toISOString(),
            service: 'viking-chess-app',
          }),
        })
      } catch (error) {
        console.error('Failed to send alert:', error)
      }
    }
  }

  static async checkSystemHealth(): Promise<void> {
    const health = await HealthChecker.getHealthStatus()

    if (health.status === 'unhealthy') {
      await this.sendAlert('critical', 'System is unhealthy', health)
    } else if (health.status === 'degraded') {
      await this.sendAlert('warning', 'System performance is degraded', health)
    }

    // Check specific thresholds
    if (health.metrics.memory.percentage > 90) {
      await this.sendAlert('warning', 'High memory usage detected', {
        memoryUsage: health.metrics.memory.percentage,
      })
    }

    if (health.metrics.requests.errorRate > 0.1) {
      await this.sendAlert('error', 'High error rate detected', {
        errorRate: health.metrics.requests.errorRate,
        totalRequests: health.metrics.requests.total,
        totalErrors: health.metrics.requests.errors,
      })
    }
  }
}

// Middleware for request/error tracking
export function withMonitoring<T extends (...args: any[]) => any>(fn: T, label: string): T {
  return ((...args: any[]) => {
    const endTimer = PerformanceMonitor.startTimer(label)
    HealthChecker.incrementRequests()

    try {
      const result = fn(...args)

      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then(value => {
            endTimer()
            return value
          })
          .catch(error => {
            endTimer()
            HealthChecker.incrementErrors()
            Sentry.captureException(error)
            throw error
          })
      }

      endTimer()
      return result
    } catch (error) {
      endTimer()
      HealthChecker.incrementErrors()
      Sentry.captureException(error)
      throw error
    }
  }) as T
}
