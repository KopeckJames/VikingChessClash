import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db-production'
import { RedisCache } from '@/lib/redis'
import { HealthChecker, HealthCheckResult } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    const health = await HealthChecker.getHealthStatus()

    // Determine HTTP status based on health
    const status = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { status })
  } catch (error) {
    console.error('Health check failed:', error)

    const errorResponse: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: 0,
      version: '1.0.0',
      services: {
        database: 'unhealthy',
        redis: 'unhealthy',
        websocket: 'unhealthy',
      },
      metrics: {
        memory: { used: 0, total: 0, percentage: 0 },
        cpu: { usage: 0 },
        requests: { total: 0, errors: 0, errorRate: 0 },
      },
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}

// Detailed health check endpoint
export async function POST(request: NextRequest) {
  try {
    const { detailed = false } = await request.json()

    if (!detailed) {
      return GET(request)
    }

    // Perform detailed health checks
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkExternalServices(),
    ])

    const detailedHealth = {
      ...(await HealthChecker.getHealthStatus()),
      detailed: {
        database:
          checks[0].status === 'fulfilled'
            ? checks[0].value
            : { status: 'error', error: checks[0].reason },
        redis:
          checks[1].status === 'fulfilled'
            ? checks[1].value
            : { status: 'error', error: checks[1].reason },
        external:
          checks[2].status === 'fulfilled'
            ? checks[2].value
            : { status: 'error', error: checks[2].reason },
      },
    }

    return NextResponse.json(detailedHealth)
  } catch (error) {
    return NextResponse.json(
      { error: 'Detailed health check failed', message: error.message },
      { status: 500 }
    )
  }
}

async function checkDatabase() {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start

    return {
      status: 'healthy',
      responseTime,
      connection: 'active',
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connection: 'failed',
    }
  }
}

async function checkRedis() {
  try {
    const start = Date.now()
    await RedisCache.set('health_check', 'ok', 10)
    const value = await RedisCache.get('health_check')
    const responseTime = Date.now() - start

    if (value === 'ok') {
      return {
        status: 'healthy',
        responseTime,
        connection: 'active',
      }
    } else {
      return {
        status: 'degraded',
        responseTime,
        connection: 'active',
        issue: 'Read/write test failed',
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connection: 'failed',
    }
  }
}

async function checkExternalServices() {
  const services = []

  // Check Sentry (if configured)
  if (process.env.SENTRY_DSN) {
    try {
      // Simple check - just verify DSN format
      const url = new URL(process.env.SENTRY_DSN)
      services.push({
        name: 'sentry',
        status: 'configured',
        host: url.host,
      })
    } catch {
      services.push({
        name: 'sentry',
        status: 'misconfigured',
      })
    }
  }

  // Check Vercel Analytics (if configured)
  if (process.env.VERCEL_ANALYTICS_ID) {
    services.push({
      name: 'vercel_analytics',
      status: 'configured',
    })
  }

  return {
    status: 'healthy',
    services,
  }
}
