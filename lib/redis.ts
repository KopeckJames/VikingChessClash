import { Redis } from '@upstash/redis'

// Initialize Redis client for Upstash
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache keys
export const CACHE_KEYS = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  GAME_STATE: (gameId: string) => `game:${gameId}`,
  LEADERBOARD: 'leaderboard:global',
  TOURNAMENT_BRACKETS: (tournamentId: string) => `tournament:${tournamentId}:brackets`,
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,
  ONLINE_USERS: 'users:online',
  MATCHMAKING_QUEUE: 'matchmaking:queue',
} as const

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  SESSION: 60 * 60 * 24 * 7, // 7 days
  GAME_STATE: 60 * 60 * 2, // 2 hours
  LEADERBOARD: 60 * 5, // 5 minutes
  TOURNAMENT_BRACKETS: 60 * 60, // 1 hour
  RATE_LIMIT: 60 * 15, // 15 minutes
  ONLINE_USERS: 60 * 2, // 2 minutes
  MATCHMAKING_QUEUE: 60 * 10, // 10 minutes
} as const

// Redis utility functions
export class RedisCache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data as T
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  static async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value))
      } else {
        await redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }

  static async incr(key: string, ttl?: number): Promise<number> {
    try {
      const result = await redis.incr(key)
      if (ttl && result === 1) {
        await redis.expire(key, ttl)
      }
      return result
    } catch (error) {
      console.error('Redis INCR error:', error)
      return 0
    }
  }

  static async sadd(key: string, member: string, ttl?: number): Promise<boolean> {
    try {
      await redis.sadd(key, member)
      if (ttl) {
        await redis.expire(key, ttl)
      }
      return true
    } catch (error) {
      console.error('Redis SADD error:', error)
      return false
    }
  }

  static async srem(key: string, member: string): Promise<boolean> {
    try {
      await redis.srem(key, member)
      return true
    } catch (error) {
      console.error('Redis SREM error:', error)
      return false
    }
  }

  static async smembers(key: string): Promise<string[]> {
    try {
      const members = await redis.smembers(key)
      return members
    } catch (error) {
      console.error('Redis SMEMBERS error:', error)
      return []
    }
  }

  static async zadd(key: string, score: number, member: string, ttl?: number): Promise<boolean> {
    try {
      await redis.zadd(key, { score, member })
      if (ttl) {
        await redis.expire(key, ttl)
      }
      return true
    } catch (error) {
      console.error('Redis ZADD error:', error)
      return false
    }
  }

  static async zrange(
    key: string,
    start: number,
    stop: number,
    withScores = false
  ): Promise<any[]> {
    try {
      if (withScores) {
        return await redis.zrange(key, start, stop, { withScores: true })
      }
      return await redis.zrange(key, start, stop)
    } catch (error) {
      console.error('Redis ZRANGE error:', error)
      return []
    }
  }
}

// Session management
export class SessionManager {
  static async setUserSession(userId: string, sessionData: any): Promise<boolean> {
    const key = CACHE_KEYS.USER_SESSION(userId)
    return RedisCache.set(key, sessionData, CACHE_TTL.SESSION)
  }

  static async getUserSession(userId: string): Promise<any | null> {
    const key = CACHE_KEYS.USER_SESSION(userId)
    return RedisCache.get(key)
  }

  static async deleteUserSession(userId: string): Promise<boolean> {
    const key = CACHE_KEYS.USER_SESSION(userId)
    return RedisCache.del(key)
  }

  static async setUserOnline(userId: string): Promise<boolean> {
    return RedisCache.sadd(CACHE_KEYS.ONLINE_USERS, userId, CACHE_TTL.ONLINE_USERS)
  }

  static async setUserOffline(userId: string): Promise<boolean> {
    return RedisCache.srem(CACHE_KEYS.ONLINE_USERS, userId)
  }

  static async getOnlineUsers(): Promise<string[]> {
    return RedisCache.smembers(CACHE_KEYS.ONLINE_USERS)
  }
}

// Game state caching
export class GameCache {
  static async setGameState(gameId: string, gameState: any): Promise<boolean> {
    const key = CACHE_KEYS.GAME_STATE(gameId)
    return RedisCache.set(key, gameState, CACHE_TTL.GAME_STATE)
  }

  static async getGameState(gameId: string): Promise<any | null> {
    const key = CACHE_KEYS.GAME_STATE(gameId)
    return RedisCache.get(key)
  }

  static async deleteGameState(gameId: string): Promise<boolean> {
    const key = CACHE_KEYS.GAME_STATE(gameId)
    return RedisCache.del(key)
  }
}

// Leaderboard caching
export class LeaderboardCache {
  static async updateUserRating(userId: string, rating: number): Promise<boolean> {
    return RedisCache.zadd(CACHE_KEYS.LEADERBOARD, rating, userId, CACHE_TTL.LEADERBOARD)
  }

  static async getTopPlayers(limit = 10): Promise<Array<{ member: string; score: number }>> {
    const results = await RedisCache.zrange(CACHE_KEYS.LEADERBOARD, 0, limit - 1, true)
    const players = []
    for (let i = 0; i < results.length; i += 2) {
      players.push({
        member: results[i],
        score: results[i + 1],
      })
    }
    return players.reverse() // Highest scores first
  }
}
