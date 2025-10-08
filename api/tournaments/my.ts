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

    const tournaments = await prisma.tournament.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
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
    console.error('Error fetching user tournaments:', error)
    res.status(500).json({ error: 'Failed to fetch tournaments' })
  }
}
