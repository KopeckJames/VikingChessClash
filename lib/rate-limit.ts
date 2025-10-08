import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

class RateLimiter {
  private cache = new Map<string, { count: number; resetTime: number }>()
  private options: RateLimitOptions

  constructor(options: RateLimitOptions) {
    this.options = options
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const key = identifier

    // Clean up expired entries
    this.cleanup(now)

    const record = this.cache.get(key)
    const resetTime = now + this.options.interval

    if (!record) {
      // First request from this identifier
      this.cache.set(key, { count: 1, resetTime })
      return {
        success: true,
        limit: this.options.uniqueTokenPerInterval,
        remaining: this.options.uniqueTokenPerInterval - 1,
        reset: resetTime,
      }
    }

    if (now > record.resetTime) {
      // Reset window has passed
      this.cache.set(key, { count: 1, resetTime })
      return {
        success: true,
        limit: this.options.uniqueTokenPerInterval,
        remaining: this.options.uniqueTokenPerInterval - 1,
        reset: resetTime,
      }
    }

    if (record.count >= this.options.uniqueTokenPerInterval) {
      // Rate limit exceeded
      return {
        success: false,
        limit: this.options.uniqueTokenPerInterval,
        remaining: 0,
        reset: record.resetTime,
      }
    }

    // Increment counter
    record.count++
    return {
      success: true,
      limit: this.options.uniqueTokenPerInterval,
      remaining: this.options.uniqueTokenPerInterval - record.count,
      reset: record.resetTime,
    }
  }

  private cleanup(now: number) {
    for (const [key, record] of this.cache.entries()) {
      if (now > record.resetTime) {
        this.cache.delete(key)
      }
    }
  }
}

// Create rate limiters for different endpoints
export const apiRateLimit = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 100, // 100 requests per 15 minutes
})

export const authRateLimit = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 5, // 5 auth attempts per 15 minutes
})

export const gameRateLimit = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 30, // 30 game actions per minute
})

export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for different proxy setups)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown'

  return `${ip}-${userAgent}`
}

export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
    },
    { status: 429 }
  )

  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  response.headers.set('Retry-After', Math.ceil((result.reset - Date.now()) / 1000).toString())

  return response
}

export async function withRateLimit(
  request: NextRequest,
  rateLimiter: RateLimiter,
  handler: () => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  const identifier = getClientIdentifier(request)
  const result = await rateLimiter.check(identifier)

  if (!result.success) {
    return createRateLimitResponse(result)
  }

  const response = await handler()

  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())

  return response
}
