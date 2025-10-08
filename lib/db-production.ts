import { PrismaClient } from '@prisma/client'
import { Pool } from '@neondatabase/serverless'

// Global variable to store Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Production database configuration
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // Add connection pool configuration for production
  if (process.env.NODE_ENV === 'production') {
    // Configure connection pooling
    client.$connect()
  }

  return client
}

// Singleton pattern for Prisma client
export const prisma = globalThis.__prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Connection pool for direct database queries (when needed)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Graceful shutdown
export async function closeDatabaseConnections(): Promise<void> {
  try {
    await prisma.$disconnect()
    await pool.end()
  } catch (error) {
    console.error('Error closing database connections:', error)
  }
}

// Connection retry logic
export async function connectWithRetry(maxRetries = 5, delay = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect()
      console.log('Database connected successfully')
      return
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error)

      if (i === maxRetries - 1) {
        throw new Error('Failed to connect to database after maximum retries')
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

// Database migration check
export async function checkMigrationStatus(): Promise<boolean> {
  try {
    // Check if migrations table exists and has recent migrations
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = '_prisma_migrations'
    `

    return Array.isArray(result) && result[0] && (result[0] as any).count > 0
  } catch (error) {
    console.error('Migration status check failed:', error)
    return false
  }
}

// Performance monitoring for database queries
export function withDatabaseMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  queryName: string
) {
  return async (...args: T): Promise<R> => {
    const start = performance.now()

    try {
      const result = await fn(...args)
      const duration = performance.now() - start

      // Log slow queries in production
      if (duration > 1000) {
        console.warn(`Slow database query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`Database query failed: ${queryName} (${duration.toFixed(2)}ms)`, error)
      throw error
    }
  }
}
