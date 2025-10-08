import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'

const addFriendSchema = z.object({
  username: z.string().min(1),
})

const updateFriendshipSchema = z.object({
  friendshipId: z.string(),
  action: z.enum(['accept', 'decline', 'block', 'unblock', 'remove']),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      // Get user's friends and friend requests
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ userId: session.user.id }, { friendId: session.user.id }],
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              rating: true,
              lastSeen: true,
            },
          },
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
      })

      const friends = friendships.map(friendship => {
        const isInitiator = friendship.userId === session.user.id
        const friendData = isInitiator ? friendship.friend : friendship.user

        return {
          id: friendship.id,
          friend: {
            id: friendData.id,
            username: friendData.username,
            displayName: friendData.displayName,
            avatar: friendData.avatar,
            rating: friendData.rating,
            isOnline: new Date(friendData.lastSeen).getTime() > Date.now() - 5 * 60 * 1000,
          },
          status: friendship.status,
          isInitiator,
          createdAt: friendship.createdAt.toISOString(),
        }
      })

      return res.status(200).json({ friends })
    }

    if (req.method === 'POST') {
      // Send friend request
      const { username } = addFriendSchema.parse(req.body)

      // Find the user to add as friend
      const friendUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true, displayName: true },
      })

      if (!friendUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      if (friendUser.id === session.user.id) {
        return res.status(400).json({ error: 'Cannot add yourself as friend' })
      }

      // Check if friendship already exists
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: session.user.id, friendId: friendUser.id },
            { userId: friendUser.id, friendId: session.user.id },
          ],
        },
      })

      if (existingFriendship) {
        return res.status(400).json({ error: 'Friendship already exists' })
      }

      // Create friend request
      const friendship = await prisma.friendship.create({
        data: {
          userId: session.user.id,
          friendId: friendUser.id,
          status: 'PENDING',
        },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              rating: true,
            },
          },
        },
      })

      return res.status(201).json({
        message: 'Friend request sent',
        friendship: {
          id: friendship.id,
          friend: friendship.friend,
          status: friendship.status,
          isInitiator: true,
        },
      })
    }

    if (req.method === 'PATCH') {
      // Update friendship status
      const { friendshipId, action } = updateFriendshipSchema.parse(req.body)

      const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
        include: {
          user: { select: { id: true } },
          friend: { select: { id: true } },
        },
      })

      if (!friendship) {
        return res.status(404).json({ error: 'Friendship not found' })
      }

      // Check if user is involved in this friendship
      const isInvolved =
        friendship.userId === session.user.id || friendship.friendId === session.user.id
      if (!isInvolved) {
        return res.status(403).json({ error: 'Not authorized to modify this friendship' })
      }

      let newStatus: 'PENDING' | 'ACCEPTED' | 'BLOCKED'
      let shouldDelete = false

      switch (action) {
        case 'accept':
          if (friendship.friendId !== session.user.id) {
            return res.status(400).json({ error: 'Only the recipient can accept a friend request' })
          }
          newStatus = 'ACCEPTED'
          break
        case 'decline':
        case 'remove':
          shouldDelete = true
          break
        case 'block':
          newStatus = 'BLOCKED'
          break
        case 'unblock':
          newStatus = 'PENDING'
          break
        default:
          return res.status(400).json({ error: 'Invalid action' })
      }

      if (shouldDelete) {
        await prisma.friendship.delete({
          where: { id: friendshipId },
        })
        return res.status(200).json({ message: 'Friendship removed' })
      } else {
        const updatedFriendship = await prisma.friendship.update({
          where: { id: friendshipId },
          data: { status: newStatus },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                rating: true,
              },
            },
            friend: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                rating: true,
              },
            },
          },
        })

        return res.status(200).json({
          message: `Friendship ${action}ed`,
          friendship: updatedFriendship,
        })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      })
    }

    console.error('Friends API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
