import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { EloRatingSystem } from '../../shared/elo-rating-system'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      page = '1',
      limit = '50',
      search = '',
      sortBy = 'rating',
      order = 'desc',
      minRating = '0',
      maxRating = '9999',
      minGames = '0',
      timeframe = 'all',
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {
      rating: {
        gte: parseInt(minRating as string),
        lte: parseInt(maxRating as string),
      },
    }

    // Add minimum games filter
    const minGamesNum = parseInt(minGames as string)
    if (minGamesNum > 0) {
      where.OR = [
        { wins: { gte: minGamesNum } },
        { losses: { gte: minGamesNum } },
        { draws: { gte: minGamesNum } },
      ]
    }

    // Add search filter
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Add timeframe filter (for active players)
    if (timeframe !== 'all') {
      const now = new Date()
      let cutoffDate = new Date()

      switch (timeframe) {
        case '7d':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case '30d':
          cutoffDate.setDate(now.getDate() - 30)
          break
        case '90d':
          cutoffDate.setDate(now.getDate() - 90)
          break
        default:
          cutoffDate.setDate(now.getDate() - 30)
      }

      where.lastSeen = { gte: cutoffDate }
    }

    // Build order by clause
    const orderBy: any = {}
    switch (sortBy) {
      case 'rating':
        orderBy.rating = order
        break
      case 'wins':
        orderBy.wins = order
        break
      case 'winRate':
        // Calculate win rate in the query
        orderBy.wins = order
        break
      case 'games':
        // We'll sort by total games (wins + losses + draws) in post-processing
        orderBy.wins = order
        break
      case 'peakRating':
        orderBy.peakRating = order
        break
      case 'winStreak':
        orderBy.winStreak = order
        break
      case 'lastSeen':
        orderBy.lastSeen = order
        break
      default:
        orderBy.rating = 'desc'
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          rating: true,
          peakRating: true,
          wins: true,
          losses: true,
          draws: true,
          winStreak: true,
          longestStreak: true,
          lastSeen: true,
          createdAt: true,
        },
        orderBy,
        skip: offset,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ])

    // Calculate additional stats and format response
    const leaderboard = users.map((user, index) => {
      const totalGames = user.wins + user.losses + user.draws
      const winRate = totalGames > 0 ? (user.wins / (user.wins + user.losses)) * 100 : 0
      const ratingClass = EloRatingSystem.getRatingClass(user.rating)
      const ratingDeviation = EloRatingSystem.calculateRatingDeviation(totalGames)

      return {
        rank: offset + index + 1,
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        rating: user.rating,
        peakRating: user.peakRating,
        ratingClass: ratingClass.title,
        ratingColor: ratingClass.color,
        ratingDeviation,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        totalGames,
        winRate: Math.round(winRate * 100) / 100,
        winStreak: user.winStreak,
        longestStreak: user.longestStreak,
        lastSeen: user.lastSeen.toISOString(),
        memberSince: user.createdAt.toISOString(),
        isActive: user.lastSeen > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Active in last 7 days
      }
    })

    // Sort by calculated fields if needed
    if (sortBy === 'winRate') {
      leaderboard.sort((a, b) => {
        return order === 'desc' ? b.winRate - a.winRate : a.winRate - b.winRate
      })
    } else if (sortBy === 'games') {
      leaderboard.sort((a, b) => {
        return order === 'desc' ? b.totalGames - a.totalGames : a.totalGames - b.totalGames
      })
    }

    // Update ranks after sorting
    leaderboard.forEach((user, index) => {
      user.rank = offset + index + 1
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum)
    const hasNextPage = pageNum < totalPages
    const hasPrevPage = pageNum > 1

    // Get some additional stats
    const globalStats = await prisma.user.aggregate({
      _avg: { rating: true },
      _max: { rating: true },
      _min: { rating: true },
      _count: { id: true },
    })

    res.status(200).json({
      leaderboard,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum,
      },
      filters: {
        search,
        sortBy,
        order,
        minRating: parseInt(minRating as string),
        maxRating: parseInt(maxRating as string),
        minGames: minGamesNum,
        timeframe,
      },
      globalStats: {
        totalPlayers: globalStats._count.id,
        averageRating: Math.round(globalStats._avg.rating || 1200),
        highestRating: globalStats._max.rating || 1200,
        lowestRating: globalStats._min.rating || 1200,
      },
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
}
