import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { db } from '../../server/db'
import { users, games } from '../../shared/schema'
import { eq, and, or, desc } from 'drizzle-orm'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = parseInt(session.user.id)

    if (req.method === 'GET') {
      // Get user stats
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          rating: users.rating,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          gamesPlayed: users.gamesPlayed,
          winStreak: users.winStreak,
          bestRating: users.bestRating,
          preferredRole: users.preferredRole,
          lastSeen: users.lastSeen,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Get recent games
      const recentGames = await db
        .select({
          id: games.id,
          status: games.status,
          hostRole: games.hostRole,
          winner: games.winner,
          winCondition: games.winCondition,
          createdAt: games.createdAt,
          completedAt: games.completedAt,
        })
        .from(games)
        .where(
          and(
            or(eq(games.hostId, userId), eq(games.guestId, userId)),
            eq(games.status, 'completed')
          )
        )
        .orderBy(desc(games.completedAt))
        .limit(10)

      // Calculate additional stats
      const winRate = user.gamesPlayed > 0 ? (user.wins / user.gamesPlayed) * 100 : 0
      const ratingChange = user.rating - 1200 // Starting rating is 1200

      res.status(200).json({
        user: {
          ...user,
          winRate: Math.round(winRate * 100) / 100,
          ratingChange,
        },
        recentGames,
      })
    } else if (req.method === 'PATCH') {
      // Update user preferences
      const { preferredRole } = req.body

      if (preferredRole && !['attacker', 'defender'].includes(preferredRole)) {
        return res.status(400).json({ error: 'Invalid preferred role' })
      }

      const updates: any = {}
      if (preferredRole) updates.preferredRole = preferredRole

      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          preferredRole: users.preferredRole,
        })

      res.status(200).json({
        message: 'User preferences updated',
        user: updatedUser,
      })
    } else {
      res.setHeader('Allow', ['GET', 'PATCH'])
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('User stats API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
