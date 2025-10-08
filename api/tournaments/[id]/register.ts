import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { authenticateUser } from '../../../middleware/auth'

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

    const { id: tournamentId } = req.query

    if (!tournamentId || typeof tournamentId !== 'string') {
      return res.status(400).json({ error: 'Invalid tournament ID' })
    }

    // Check if tournament exists and is accepting registrations
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: true,
      },
    })

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' })
    }

    if (tournament.status !== 'REGISTRATION') {
      return res.status(400).json({ error: 'Tournament registration is closed' })
    }

    if (new Date() > tournament.registrationEnd) {
      return res.status(400).json({ error: 'Registration period has ended' })
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      return res.status(400).json({ error: 'Tournament is full' })
    }

    // Check if user is already registered
    const existingParticipant = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
    })

    if (existingParticipant) {
      return res.status(400).json({ error: 'Already registered for this tournament' })
    }

    // Register the user
    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId: user.id,
      },
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
    })

    res.status(201).json({
      id: participant.id,
      tournamentId: participant.tournamentId,
      user: participant.user,
      registeredAt: participant.registeredAt.toISOString(),
    })
  } catch (error) {
    console.error('Error registering for tournament:', error)
    res.status(500).json({ error: 'Failed to register for tournament' })
  }
}
