import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { authenticateUser } from '../../middleware/auth'
import { MatchmakingSystem, Player, MatchmakingPreferences } from '../../shared/matchmaking-system'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await authenticateUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const {
      timeControl = '15+10',
      maxRatingDifference,
      preferredRole,
      allowUnranked = true,
    } = req.body

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        rating: true,
        wins: true,
        losses: true,
        draws: true,
        winStreak: true,
        preferredRole: true,
        lastSeen: true,
      },
    })

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Convert to matchmaking player format
    const player: Player = {
      id: currentUser.id,
      rating: currentUser.rating,
      gamesPlayed: currentUser.wins + currentUser.losses + currentUser.draws,
      preferredRole: currentUser.preferredRole,
      winStreak: currentUser.winStreak,
      lastGameAt: currentUser.lastSeen,
      isOnline: true,
      searchStartTime: new Date(),
    }

    const preferences: MatchmakingPreferences = {
      timeControl,
      maxRatingDifference,
      preferredRole,
      allowUnranked,
    }

    // Get potential opponents (online users looking for games)
    const candidateUsers = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        lastSeen: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Active in last 5 minutes
        },
      },
      select: {
        id: true,
        rating: true,
        wins: true,
        losses: true,
        draws: true,
        winStreak: true,
        preferredRole: true,
        lastSeen: true,
      },
      take: 100, // Limit to prevent performance issues
    })

    // Convert to matchmaking format
    const candidatePool: Player[] = candidateUsers.map(candidate => ({
      id: candidate.id,
      rating: candidate.rating,
      gamesPlayed: candidate.wins + candidate.losses + candidate.draws,
      preferredRole: candidate.preferredRole,
      winStreak: candidate.winStreak,
      lastGameAt: candidate.lastSeen,
      isOnline: true,
      searchStartTime: new Date(), // This would be tracked separately in a real system
    }))

    // Find the best match
    const match = MatchmakingSystem.findMatch(player, candidatePool, preferences)

    if (!match) {
      // No match found, return matchmaking stats
      const stats = MatchmakingSystem.getMatchmakingStats(player, candidatePool, preferences)

      return res.status(200).json({
        matchFound: false,
        stats,
        message:
          'No suitable opponents found. Try adjusting your preferences or wait for more players.',
      })
    }

    // Create a game with the matched opponent
    const game = await prisma.game.create({
      data: {
        hostId: player.id,
        guestId: match.player2.id,
        hostRole: match.player1Role,
        timeControl,
        isRanked: true,
        status: 'WAITING',
        boardState: [], // Will be initialized by game logic
        moveHistory: [],
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            rating: true,
            avatar: true,
          },
        },
        guest: {
          select: {
            id: true,
            username: true,
            displayName: true,
            rating: true,
            avatar: true,
          },
        },
      },
    })

    res.status(200).json({
      matchFound: true,
      game: {
        id: game.id,
        host: game.host,
        guest: game.guest,
        hostRole: game.hostRole,
        timeControl: game.timeControl,
        status: game.status,
        createdAt: game.createdAt.toISOString(),
      },
      matchDetails: {
        ratingDifference: match.ratingDifference,
        matchQuality: match.matchQuality,
        estimatedGameTime: match.estimatedGameTime,
        roles: {
          [player.id]: match.player1Role,
          [match.player2.id]: match.player2Role,
        },
      },
    })
  } catch (error) {
    console.error('Error in matchmaking:', error)
    res.status(500).json({ error: 'Failed to find match' })
  }
}
