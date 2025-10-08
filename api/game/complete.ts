import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { db } from '../../server/db'
import { users, games, aiGames, aiOpponents } from '../../shared/schema'
import { eq, and } from 'drizzle-orm'

// Simple ELO rating calculation
function calculateNewRating(
  playerRating: number,
  opponentRating: number,
  result: number,
  kFactor = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
  return Math.round(playerRating + kFactor * (result - expectedScore))
}

// Handle AI game completion
async function handleAIGameCompletion(
  userId: number,
  winner: string,
  winCondition: string,
  aiLevel: string,
  playerRole: string,
  res: NextApiResponse
) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get AI opponent rating based on level
    const aiRatings = {
      easy: 800,
      medium: 1200,
      hard: 1600,
    }
    const aiRating = aiRatings[aiLevel as keyof typeof aiRatings] || 1200

    // Determine if player won
    const playerWon = winner === playerRole
    const isDraw = winner === 'draw'

    // Calculate new rating
    const result = isDraw ? 0.5 : playerWon ? 1 : 0
    const newRating = calculateNewRating(user.rating, aiRating, result)

    // Update user stats
    const newWinStreak = playerWon ? user.winStreak + 1 : 0
    const newBestRating = Math.max(user.bestRating, newRating)

    await db
      .update(users)
      .set({
        rating: newRating,
        wins: playerWon ? user.wins + 1 : user.wins,
        losses: !playerWon && !isDraw ? user.losses + 1 : user.losses,
        draws: isDraw ? user.draws + 1 : user.draws,
        gamesPlayed: user.gamesPlayed + 1,
        winStreak: newWinStreak,
        bestRating: newBestRating,
      })
      .where(eq(users.id, userId))

    return res.status(200).json({
      message: 'AI game completed successfully',
      winner,
      winCondition,
      ratingChange: newRating - user.rating,
      newRating,
    })
  } catch (error) {
    console.error('AI game completion error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { gameId, winner, winCondition, isAIGame, aiLevel, playerRole } = req.body
    const userId = parseInt(session.user.id)

    if (!winner || !winCondition) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Handle AI games differently (they don't have a real gameId in the database)
    if (isAIGame) {
      return handleAIGameCompletion(userId, winner, winCondition, aiLevel, playerRole, res)
    }

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required for multiplayer games' })
    }

    // Get game details
    const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1)

    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    // Verify user is part of this game
    if (game.hostId !== userId && game.guestId !== userId) {
      return res.status(403).json({ error: 'Not authorized for this game' })
    }

    // Check if game is already completed
    if (game.status === 'completed') {
      return res.status(400).json({ error: 'Game already completed' })
    }

    // Update game status
    await db
      .update(games)
      .set({
        status: 'completed',
        winner,
        winCondition,
        completedAt: new Date(),
      })
      .where(eq(games.id, gameId))

    // Check if this is an AI game
    const [aiGame] = await db.select().from(aiGames).where(eq(aiGames.gameId, gameId)).limit(1)

    if (aiGame) {
      // Handle AI game completion
      const [aiOpponent] = await db
        .select()
        .from(aiOpponents)
        .where(eq(aiOpponents.id, aiGame.aiOpponentId))
        .limit(1)

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

      if (user && aiOpponent) {
        // Determine if player won
        const playerRole = game.hostRole
        const playerWon = winner === playerRole
        const isDraw = winner === 'draw'

        // Calculate new rating against AI
        const result = isDraw ? 0.5 : playerWon ? 1 : 0
        const newRating = calculateNewRating(user.rating, aiOpponent.rating, result)

        // Update user stats
        const newWinStreak = playerWon ? user.winStreak + 1 : 0
        const newBestRating = Math.max(user.bestRating, newRating)

        await db
          .update(users)
          .set({
            rating: newRating,
            wins: playerWon ? user.wins + 1 : user.wins,
            losses: !playerWon && !isDraw ? user.losses + 1 : user.losses,
            draws: isDraw ? user.draws + 1 : user.draws,
            gamesPlayed: user.gamesPlayed + 1,
            winStreak: newWinStreak,
            bestRating: newBestRating,
          })
          .where(eq(users.id, userId))

        // Update AI opponent stats
        await db
          .update(aiOpponents)
          .set({
            wins: !playerWon && !isDraw ? aiOpponent.wins + 1 : aiOpponent.wins,
            losses: playerWon ? aiOpponent.losses + 1 : aiOpponent.losses,
            draws: isDraw ? aiOpponent.draws + 1 : aiOpponent.draws,
            gamesPlayed: aiOpponent.gamesPlayed + 1,
          })
          .where(eq(aiOpponents.id, aiGame.aiOpponentId))
      }
    } else {
      // Handle multiplayer game completion
      if (game.guestId) {
        const [hostUser] = await db.select().from(users).where(eq(users.id, game.hostId)).limit(1)

        const [guestUser] = await db.select().from(users).where(eq(users.id, game.guestId)).limit(1)

        if (hostUser && guestUser) {
          const hostRole = game.hostRole
          const guestRole = hostRole === 'attacker' ? 'defender' : 'attacker'

          const hostWon = winner === hostRole
          const guestWon = winner === guestRole
          const isDraw = winner === 'draw'

          // Calculate new ratings
          const hostResult = isDraw ? 0.5 : hostWon ? 1 : 0
          const guestResult = isDraw ? 0.5 : guestWon ? 1 : 0

          const newHostRating = calculateNewRating(hostUser.rating, guestUser.rating, hostResult)
          const newGuestRating = calculateNewRating(guestUser.rating, hostUser.rating, guestResult)

          // Update host stats
          const hostWinStreak = hostWon ? hostUser.winStreak + 1 : 0
          const hostBestRating = Math.max(hostUser.bestRating, newHostRating)

          await db
            .update(users)
            .set({
              rating: newHostRating,
              wins: hostWon ? hostUser.wins + 1 : hostUser.wins,
              losses: guestWon ? hostUser.losses + 1 : hostUser.losses,
              draws: isDraw ? hostUser.draws + 1 : hostUser.draws,
              gamesPlayed: hostUser.gamesPlayed + 1,
              winStreak: hostWinStreak,
              bestRating: hostBestRating,
            })
            .where(eq(users.id, game.hostId))

          // Update guest stats
          const guestWinStreak = guestWon ? guestUser.winStreak + 1 : 0
          const guestBestRating = Math.max(guestUser.bestRating, newGuestRating)

          await db
            .update(users)
            .set({
              rating: newGuestRating,
              wins: guestWon ? guestUser.wins + 1 : guestUser.wins,
              losses: hostWon ? guestUser.losses + 1 : guestUser.losses,
              draws: isDraw ? guestUser.draws + 1 : guestUser.draws,
              gamesPlayed: guestUser.gamesPlayed + 1,
              winStreak: guestWinStreak,
              bestRating: guestBestRating,
            })
            .where(eq(users.id, game.guestId))
        }
      }
    }

    res.status(200).json({
      message: 'Game completed successfully',
      gameId,
      winner,
      winCondition,
    })
  } catch (error) {
    console.error('Game completion error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
