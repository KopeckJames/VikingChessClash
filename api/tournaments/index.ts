import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { authenticateUser } from '../../middleware/auth'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getTournaments(req, res)
  } else if (req.method === 'POST') {
    return createTournament(req, res)
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function getTournaments(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status, format, limit = '50' } = req.query

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (format && format !== 'all') {
      where.format = format
    }

    const tournaments = await prisma.tournament.findMany({
      where,
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
        _count: {
          select: {
            participants: true,
            games: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { startDate: 'asc' }],
      take: parseInt(limit as string),
    })

    const formattedTournaments = tournaments.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      format: tournament.format,
      status: tournament.status,
      maxParticipants: tournament.maxParticipants,
      currentParticipants: tournament._count.participants,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      timeControl: tournament.timeControl,
      registrationEnd: tournament.registrationEnd.toISOString(),
      startDate: tournament.startDate.toISOString(),
      endDate: tournament.endDate?.toISOString(),
      createdAt: tournament.createdAt.toISOString(),
      participants: tournament.participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        displayName: p.user.displayName,
        rating: p.user.rating,
        avatar: p.user.avatar,
        registeredAt: p.registeredAt.toISOString(),
        wins: p.wins,
        losses: p.losses,
        draws: p.draws,
        points: p.points,
        rank: p.rank,
      })),
    }))

    res.status(200).json(formattedTournaments)
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    res.status(500).json({ error: 'Failed to fetch tournaments' })
  }
}

async function createTournament(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await authenticateUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const {
      name,
      description,
      format,
      maxParticipants,
      entryFee = 0,
      prizePool = 0,
      timeControl,
      registrationEnd,
      startDate,
    } = req.body

    // Validate required fields
    if (!name || !format || !maxParticipants || !timeControl || !registrationEnd || !startDate) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate dates
    const regEndDate = new Date(registrationEnd)
    const startDateTime = new Date(startDate)
    const now = new Date()

    if (regEndDate <= now) {
      return res.status(400).json({ error: 'Registration end date must be in the future' })
    }

    if (startDateTime <= regEndDate) {
      return res.status(400).json({ error: 'Start date must be after registration end date' })
    }

    // Validate participant count (must be power of 2 for elimination tournaments)
    if (
      (format === 'SINGLE_ELIMINATION' || format === 'DOUBLE_ELIMINATION') &&
      !isPowerOfTwo(maxParticipants)
    ) {
      return res.status(400).json({
        error:
          'Elimination tournaments require participant count to be a power of 2 (8, 16, 32, 64, etc.)',
      })
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        format,
        maxParticipants,
        entryFee,
        prizePool,
        timeControl,
        registrationEnd: regEndDate,
        startDate: startDateTime,
        status: 'REGISTRATION',
      },
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
        },
      },
    })

    res.status(201).json({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      format: tournament.format,
      status: tournament.status,
      maxParticipants: tournament.maxParticipants,
      currentParticipants: tournament.participants.length,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      timeControl: tournament.timeControl,
      registrationEnd: tournament.registrationEnd.toISOString(),
      startDate: tournament.startDate.toISOString(),
      createdAt: tournament.createdAt.toISOString(),
      participants: tournament.participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        displayName: p.user.displayName,
        rating: p.user.rating,
        avatar: p.user.avatar,
        registeredAt: p.registeredAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error creating tournament:', error)
    res.status(500).json({ error: 'Failed to create tournament' })
  }
}

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}
