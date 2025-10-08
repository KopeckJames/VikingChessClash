import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { db } from '../../server/db'
import { users } from '../../shared/schema'
import { eq, or } from 'drizzle-orm'

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { username, displayName, password } = registerSchema.parse(req.body)

    // Check if username already exists
    const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1)

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already taken' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        displayName,
        password: hashedPassword,
        rating: 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        gamesPlayed: 0,
        winStreak: 0,
        bestRating: 1200,
        preferredRole: 'defender',
      })
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        rating: users.rating,
        createdAt: users.createdAt,
      })

    res.status(201).json({
      message: 'User created successfully. You can now sign in.',
      user: newUser,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      })
    }

    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
