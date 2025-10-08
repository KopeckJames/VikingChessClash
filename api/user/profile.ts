import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  preferredRole: z.enum(['ATTACKER', 'DEFENDER']).optional(),
  theme: z.string().optional(),
  language: z.string().optional(),
  notifications: z.boolean().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      // Get user profile with achievements and friends
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          achievements: {
            include: {
              achievement: true,
            },
            orderBy: {
              unlockedAt: 'desc',
            },
          },
          friends: {
            where: {
              status: 'ACCEPTED',
            },
            include: {
              friend: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  rating: true,
                  lastSeen: true,
                },
              },
            },
          },
        },
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Transform achievements
      const achievements = user.achievements.map(ua => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        category: ua.achievement.category,
        points: ua.achievement.points,
        unlockedAt: ua.unlockedAt.toISOString(),
      }))

      // Transform friends with online status
      const friends = user.friends.map(f => ({
        id: f.friend.id,
        username: f.friend.username,
        displayName: f.friend.displayName,
        avatar: f.friend.avatar,
        rating: f.friend.rating,
        isOnline: new Date(f.friend.lastSeen).getTime() > Date.now() - 5 * 60 * 1000, // Online if seen within 5 minutes
        status: 'ACCEPTED' as const,
      }))

      const profile = {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        rating: user.rating,
        peakRating: user.peakRating,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        winStreak: user.winStreak,
        longestStreak: user.longestStreak,
        preferredRole: user.preferredRole,
        theme: user.theme,
        language: user.language,
        notifications: user.notifications,
        createdAt: user.createdAt.toISOString(),
        lastSeen: user.lastSeen.toISOString(),
        achievements,
        friends,
      }

      return res.status(200).json(profile)
    }

    if (req.method === 'PATCH') {
      // Update user profile
      const updateData = updateProfileSchema.parse(req.body)

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          displayName: true,
          preferredRole: true,
          theme: true,
          language: true,
          notifications: true,
        },
      })

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser,
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      })
    }

    console.error('Profile API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
