import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import * as schema from '../shared/schema'

async function runMigrations() {
  console.log('🔄 Running production database migrations...')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const db = drizzle({ client: pool, schema })

    console.log('📡 Connecting to database...')

    // Run migrations
    await migrate(db, { migrationsFolder: './migrations' })

    console.log('✅ Migrations completed successfully!')

    // Close the connection
    await pool.end()
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('🎉 Database migration completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })
