import type { NextApiRequest, NextApiResponse } from 'next'
import { aiService } from '../../server/ai-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get all AI opponents
      const opponents = await aiService.getAIOpponents()
      return res.status(200).json(opponents)
    }

    if (req.method === 'POST') {
      // Create game against AI
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { aiOpponentId, userRole, timeControl } = req.body

      if (!aiOpponentId || !userRole) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      if (!['attacker', 'defender'].includes(userRole)) {
        return res.status(400).json({ error: 'Invalid user role' })
      }

      const result = await aiService.createAIGame(
        parseInt(session.user.id),
        aiOpponentId,
        userRole,
        timeControl
      )

      if (!result) {
        return res.status(404).json({ error: 'AI opponent not found' })
      }

      return res.status(201).json(result)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('AI opponents API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
