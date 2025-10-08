import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { authenticateUser } from '../../../middleware/auth'
import { MatchmakingSystem, Player } from '../../../shared/matchmaking-system'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getTournamentBrackets(req, res)
  } else if (req.method === 'POST') {
    return generateTournamentBrackets(req, res)
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function getTournamentBrackets(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id: tournamentId } = req.query

    if (!tournamentId || typeof tournamentId !== 'string') {
      return res.status(400).json({ error: 'Invalid tournament ID' })
    }

    // Get tournament with games and participants
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                rating: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            registeredAt: 'asc',
          },
        },
        games: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    // Calculate max rounds for elimination tournaments
    let maxRounds = 1
    if (tournament.format === 'SINGLE_ELIMINATION') {
      maxRounds = Math.ceil(Math.log2(tournament.participants.length))
    } else if (tournament.format === 'DOUBLE_ELIMINATION') {
      maxRounds = Math.ceil(Math.log2(tournament.participants.length)) * 2 - 1
    } else if (tournament.format === 'ROUND_ROBIN') {
      maxRounds = tournament.participants.length - 1
    } else if (tournament.format === 'SWISS') {
      maxRounds = Math.ceil(Math.log2(tournament.participants.length))
    }

    // Format matches for bracket display
    const matches = tournament.games.map((game, index) => {
      // Determine round and position based on tournament format
      let round = 1
      let position = index + 1

      // For elimination tournaments, calculate actual round
      if (tournament.format === 'SINGLE_ELIMINATION') {
        const totalMatches = tournament.participants.length - 1
        const firstRoundMatches = tournament.participants.length / 2

        if (index < firstRoundMatches) {
          round = 1
          position = index + 1
        } else {
          // Calculate round for later matches
          let matchesInPreviousRounds = firstRoundMatches
          round = 2

          while (index >= matchesInPreviousRounds + Math.pow(2, maxRounds - round)) {
            matchesInPreviousRounds += Math.pow(2, maxRounds - round)
            round++
          }

          position = index - matchesInPreviousRounds + 1
        }
      }

      return {
        id: game.id,
        round,
        position,
        player1: game.host
          ? {
              id: game.host.id,
              username: game.host.username,
              displayName: game.host.displayName,
              rating: game.host.rating,
              avatar: game.host.avatar,
            }
          : undefined,
        player2: game.guest
          ? {
              id: game.guest.id,
              username: game.guest.username,
              displayName: game.guest.displayName,
              rating: game.guest.rating,
              avatar: game.guest.avatar,
            }
          : undefined,
        winner: game.winnerId,
        status: game.status.toLowerCase(),
        scheduledAt: game.createdAt.toISOString(),
        completedAt: game.completedAt?.toISOString(),
      }
    })

    res.status(200).json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        status: tournament.status,
        maxParticipants: tournament.maxParticipants,
        currentParticipants: tournament.participants.length,
      },
      matches,
      maxRounds,
      participants: tournament.participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        displayName: p.user.displayName,
        rating: p.user.rating,
        avatar: p.user.avatar,
        wins: p.wins,
        losses: p.losses,
        draws: p.draws,
        points: p.points,
        rank: p.rank,
      })),
    })
  } catch (error) {
    console.error('Error fetching tournament brackets:', error)
    res.status(500).json({ error: 'Failed to fetch tournament brackets' })
  }
}

async function generateTournamentBrackets(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await authenticateUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { id: tournamentId } = req.query

    if (!tournamentId || typeof tournamentId !== 'string') {
      return res.status(400).json({ error: 'Invalid tournament ID' })
    }

    // Get tournament with participants
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                rating: true,
                avatar: true,
                wins: true,
                losses: true,
                draws: true,
                winStreak: true,
                preferredRole: true,
              },
            },
          },
        },
      },
    })

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    if (tournament.status !== 'REGISTRATION') {
      return res
        .status(400)
        .json({ error: 'Tournament brackets can only be generated during registration' })
    }

    // Check if tournament has enough participants
    const minParticipants = tournament.format === 'ROUND_ROBIN' ? 3 : 4
    if (tournament.participants.length < minParticipants) {
      return res.status(400).json({
        error: `Tournament needs at least ${minParticipants} participants`,
      })
    }

    // Convert participants to matchmaking format
    const players: Player[] = tournament.participants.map(p => ({
      id: p.user.id,
      rating: p.user.rating,
      gamesPlayed: p.user.wins + p.user.losses + p.user.draws,
      preferredRole: p.user.preferredRole,
      winStreak: p.user.winStreak,
      isOnline: true,
      searchStartTime: new Date(),
    }))

    // Generate bracket matches
    const bracketMatches = MatchmakingSystem.createTournamentBrackets(players, tournament.format)

    // Create games in database
    const createdGames = await Promise.all(
      bracketMatches.map(async (match, index) => {
        // Determine roles (alternate or use preferences)
        const hostRole = index % 2 === 0 ? 'DEFENDER' : 'ATTACKER'

        return prisma.game.create({
          data: {
            hostId: match.player1.id,
            guestId: match.player2.id,
            hostRole,
            timeControl: tournament.timeControl,
            isRanked: true,
            status: 'WAITING',
            tournamentId: tournament.id,
            boardState: [],
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
      })
    )

    // Update tournament status to ACTIVE
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'ACTIVE' },
    })

    res.status(201).json({
      message: 'Tournament brackets generated successfully',
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        status: 'ACTIVE',
      },
      games: createdGames.map(game => ({
        id: game.id,
        host: game.host,
        guest: game.guest,
        hostRole: game.hostRole,
        timeControl: game.timeControl,
        status: game.status,
        createdAt: game.createdAt.toISOString(),
      })),
      totalMatches: createdGames.length,
    })
  } catch (error) {
    console.error('Error generating tournament brackets:', error)
    res.status(500).json({ error: 'Failed to generate tournament brackets' })
  }
}
