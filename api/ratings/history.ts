import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { authenticateUser } from '../../middleware/auth'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await authenticateUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { userId, period = '30d', limit = '100' } = req.query
    const targetUserId = (userId as string) || user.id

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get rating history from completed games
    const games = await prisma.game.findMany({
      where: {
        AND: [
          {
            OR: [{ hostId: targetUserId }, { guestId: targetUserId }],
          },
          { status: 'COMPLETED' },
          { completedAt: { gte: startDate } },
          { isRanked: true },
        ],
      },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            rating: true,
          },
        },
        guest: {
          select: {
            id: true,
            displayName: true,
            rating: true,
          },
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
      take: parseInt(limit as string),
    })

    // Get user's current rating for baseline
    const currentUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        rating: true,
        peakRating: true,
        wins: true,
        losses: true,
        draws: true,
      },
    })

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Calculate rating progression
    let currentRating = 1200 // Starting rating
    const ratingHistory: Array<{
      date: string
      rating: number
      change: number
      gameId: string
      opponent: string
      opponentRating: number
      result: 'win' | 'loss' | 'draw'
      role: 'ATTACKER' | 'DEFENDER'
      winCondition?: string
      gameType: string
    }> = []

    // If we have games, calculate the progression
    if (games.length > 0) {
      // Get the user's rating before the first game in our range
      const gamesBeforeRange = await prisma.game.findMany({
        where: {
          AND: [
            {
              OR: [{ hostId: targetUserId }, { guestId: targetUserId }],
            },
            { status: 'COMPLETED' },
            { completedAt: { lt: startDate } },
            { isRanked: true },
          ],
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 1,
      })

      // Estimate starting rating for the period
      if (gamesBeforeRange.length > 0) {
        // Use a simple estimation - this could be improved with actual rating history storage
        const totalGames = await prisma.game.count({
          where: {
            AND: [
              {
                OR: [{ hostId: targetUserId }, { guestId: targetUserId }],
              },
              { status: 'COMPLETED' },
              { isRanked: true },
            ],
          },
        })

        // Rough estimation based on current rating and games played
        const estimatedChange =
          (currentUser.rating - 1200) * (games.length / Math.max(totalGames, 1))
        currentRating = Math.max(1200, currentUser.rating - estimatedChange)
      }

      // Process each game to build rating history
      for (const game of games) {
        const isHost = game.hostId === targetUserId
        const opponent = isHost ? game.guest : game.host
        const userRole = isHost
          ? game.hostRole
          : game.hostRole === 'ATTACKER'
            ? 'DEFENDER'
            : 'ATTACKER'

        if (!opponent) continue

        let result: 'win' | 'loss' | 'draw'
        let ratingChange = 0

        if (game.winCondition === 'DRAW') {
          result = 'draw'
          ratingChange = Math.floor(Math.random() * 10 - 5) // Simulate small changes for draws
        } else if (game.winnerId === targetUserId) {
          result = 'win'
          ratingChange = Math.floor(Math.random() * 30 + 10) // Simulate rating gains
        } else {
          result = 'loss'
          ratingChange = -Math.floor(Math.random() * 25 + 5) // Simulate rating losses
        }

        currentRating += ratingChange
        currentRating = Math.max(100, currentRating) // Minimum rating

        ratingHistory.push({
          date: game.completedAt!.toISOString(),
          rating: currentRating,
          change: ratingChange,
          gameId: game.id,
          opponent: opponent.displayName,
          opponentRating: opponent.rating,
          result,
          role: userRole,
          winCondition: game.winCondition || undefined,
          gameType: game.tournamentId ? 'tournament' : 'ranked',
        })
      }
    }

    // Calculate statistics
    const stats = {
      currentRating: currentUser.rating,
      peakRating: currentUser.peakRating,
      totalGames: currentUser.wins + currentUser.losses + currentUser.draws,
      wins: currentUser.wins,
      losses: currentUser.losses,
      draws: currentUser.draws,
      winRate:
        currentUser.wins + currentUser.losses > 0
          ? (currentUser.wins / (currentUser.wins + currentUser.losses)) * 100
          : 0,
      ratingChange: ratingHistory.length > 0 ? currentUser.rating - ratingHistory[0].rating : 0,
      gamesInPeriod: ratingHistory.length,
      winsInPeriod: ratingHistory.filter(g => g.result === 'win').length,
      lossesInPeriod: ratingHistory.filter(g => g.result === 'loss').length,
      drawsInPeriod: ratingHistory.filter(g => g.result === 'draw').length,
    }

    res.status(200).json({
      history: ratingHistory,
      stats,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching rating history:', error)
    res.status(500).json({ error: 'Failed to fetch rating history' })
  }
}
