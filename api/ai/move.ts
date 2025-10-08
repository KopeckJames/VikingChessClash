import type { NextApiRequest, NextApiResponse } from 'next'
import { aiService } from '../../server/ai-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { gameId } = req.body

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' })
    }

    // Verify this is an AI game
    const isAI = await aiService.isAIGame(gameId)
    if (!isAI) {
      return res.status(400).json({ error: 'Not an AI game' })
    }

    // Get AI move
    const move = await aiService.getAIMove(gameId)

    if (!move) {
      return res.status(404).json({ error: 'Could not generate AI move' })
    }

    return res.status(200).json({ move })
  } catch (error) {
    console.error('AI move API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
