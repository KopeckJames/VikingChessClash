import { Router } from 'express'
import { db } from './db'
import { games, users } from '@shared/schema'
import { eq, and } from 'drizzle-orm'
import {
  isValidMove,
  calculateCaptures,
  checkWinCondition,
  createInitialBoard,
} from '../client/src/lib/game-logic'
import { aiService } from './ai-service'
import type { Move, BoardState, PieceType, Position } from '@shared/schema'

const router = Router()

// Get game by ID
router.get('/games/:id', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id)

    const game = await db.select().from(games).where(eq(games.id, gameId)).limit(1)

    if (!game.length) {
      return res.status(404).json({ error: 'Game not found' })
    }

    // Get player information
    const gameData = game[0]
    const host = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        rating: users.rating,
      })
      .from(users)
      .where(eq(users.id, gameData.hostId))
      .limit(1)

    let guest = null
    if (gameData.guestId) {
      const guestData = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          rating: users.rating,
        })
        .from(users)
        .where(eq(users.id, gameData.guestId))
        .limit(1)
      guest = guestData[0] || null
    }

    res.json({
      ...gameData,
      host: host[0],
      guest,
    })
  } catch (error) {
    console.error('Error fetching game:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Validate move endpoint
router.post('/games/:id/validate-move', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id)
    const { move }: { move: Move } = req.body

    if (!move || !move.from || !move.to || !move.piece) {
      return res.status(400).json({ error: 'Invalid move data' })
    }

    // Get current game state
    const game = await db.select().from(games).where(eq(games.id, gameId)).limit(1)

    if (!game.length) {
      return res.status(404).json({ error: 'Game not found' })
    }

    const gameData = game[0]

    if (gameData.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' })
    }

    const board = gameData.boardState as BoardState

    // Validate the move
    const isValid = isValidMove(board, move.from, move.to, move.piece)

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid move' })
    }

    // Calculate potential captures
    const captures = calculateCaptures(board, move.to)

    res.json({
      valid: true,
      captures,
      move: {
        ...move,
        captured: captures,
      },
    })
  } catch (error) {
    console.error('Error validating move:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Make move endpoint
router.post('/games/:id/moves', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id)
    const { move }: { move: Move } = req.body

    if (!move || !move.from || !move.to || !move.piece) {
      return res.status(400).json({ error: 'Invalid move data' })
    }

    // Get current game state
    const game = await db.select().from(games).where(eq(games.id, gameId)).limit(1)

    if (!game.length) {
      return res.status(404).json({ error: 'Game not found' })
    }

    const gameData = game[0]

    if (gameData.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' })
    }

    const board = gameData.boardState as BoardState

    // Validate the move
    const isValid = isValidMove(board, move.from, move.to, move.piece)

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid move' })
    }

    // Apply the move to the board
    const newBoard = board.map(row => [...row])
    newBoard[move.to.row][move.to.col] = move.piece
    newBoard[move.from.row][move.from.col] = null

    // Calculate and apply captures
    const captures = calculateCaptures(newBoard, move.to)
    captures.forEach(pos => {
      newBoard[pos.row][pos.col] = null
    })

    // Update move with captures
    const finalMove: Move = {
      ...move,
      captured: captures,
      timestamp: Date.now(),
    }

    // Check win condition
    const winResult = checkWinCondition(newBoard)

    // Update move history
    const currentMoveHistory = (gameData.moveHistory as Move[]) || []
    const newMoveHistory = [...currentMoveHistory, finalMove]

    // Determine next player
    const nextPlayer = gameData.currentPlayer === 'attacker' ? 'defender' : 'attacker'

    // Update game in database
    const updateData: any = {
      boardState: newBoard,
      moveHistory: newMoveHistory,
      currentPlayer: nextPlayer,
    }

    // If game is won, update game status
    if (winResult.winner) {
      updateData.status = 'completed'
      updateData.winner = winResult.winner
      updateData.winCondition = winResult.condition
      updateData.completedAt = new Date()

      // Determine winner ID
      if (winResult.winner === gameData.hostRole) {
        updateData.winnerId = gameData.hostId
      } else if (gameData.guestId) {
        updateData.winnerId = gameData.guestId
      }
    }

    await db.update(games).set(updateData).where(eq(games.id, gameId))

    // Get updated game data
    const updatedGame = await db.select().from(games).where(eq(games.id, gameId)).limit(1)

    let aiMove = null

    // If game is still active and it's AI's turn, generate AI move
    if (!winResult.winner && (await aiService.isAIGame(gameId))) {
      const aiGameInfo = await aiService.getAIGameInfo(gameId)
      if (aiGameInfo && aiGameInfo.aiRole === nextPlayer) {
        // Generate AI move after a short delay for realism
        setTimeout(
          async () => {
            try {
              const generatedMove = await aiService.getAIMove(gameId)
              if (generatedMove) {
                // Apply AI move using the same logic
                const currentGame = await db
                  .select()
                  .from(games)
                  .where(eq(games.id, gameId))
                  .limit(1)

                if (currentGame.length && currentGame[0].status === 'active') {
                  const currentBoard = currentGame[0].boardState as BoardState

                  // Apply AI move
                  const aiNewBoard = currentBoard.map(row => [...row])
                  aiNewBoard[generatedMove.to.row][generatedMove.to.col] = generatedMove.piece
                  aiNewBoard[generatedMove.from.row][generatedMove.from.col] = null

                  // Calculate and apply AI captures
                  const aiCaptures = calculateCaptures(aiNewBoard, generatedMove.to)
                  aiCaptures.forEach(pos => {
                    aiNewBoard[pos.row][pos.col] = null
                  })

                  const finalAIMove: Move = {
                    ...generatedMove,
                    captured: aiCaptures,
                    timestamp: Date.now(),
                  }

                  // Check AI win condition
                  const aiWinResult = checkWinCondition(aiNewBoard)

                  // Update AI move history
                  const currentAIMoveHistory = (currentGame[0].moveHistory as Move[]) || []
                  const newAIMoveHistory = [...currentAIMoveHistory, finalAIMove]

                  // Determine next player after AI
                  const nextPlayerAfterAI = nextPlayer === 'attacker' ? 'defender' : 'attacker'

                  // Update game with AI move
                  const aiUpdateData: any = {
                    boardState: aiNewBoard,
                    moveHistory: newAIMoveHistory,
                    currentPlayer: nextPlayerAfterAI,
                  }

                  // If AI won, update game status
                  if (aiWinResult.winner) {
                    aiUpdateData.status = 'completed'
                    aiUpdateData.winner = aiWinResult.winner
                    aiUpdateData.winCondition = aiWinResult.condition
                    aiUpdateData.completedAt = new Date()

                    // Update AI stats
                    const result = aiWinResult.winner === aiGameInfo.aiRole ? 'win' : 'loss'
                    await aiService.updateAIStats(aiGameInfo.aiOpponent.id, result)
                    aiService.cleanupAIInstance(gameId)
                  }

                  await db.update(games).set(aiUpdateData).where(eq(games.id, gameId))
                }
              }
            } catch (error) {
              console.error('Error generating AI move:', error)
            }
          },
          Math.random() * 1000 + 500
        ) // 500-1500ms delay
      }
    }

    res.json({
      success: true,
      move: finalMove,
      game: updatedGame[0],
      winResult,
    })
  } catch (error) {
    console.error('Error making move:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get game history endpoint
router.get('/games/:id/history', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id)

    const game = await db
      .select({ moveHistory: games.moveHistory })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)

    if (!game.length) {
      return res.status(404).json({ error: 'Game not found' })
    }

    const moveHistory = (game[0].moveHistory as Move[]) || []

    res.json({
      moves: moveHistory,
      totalMoves: moveHistory.length,
    })
  } catch (error) {
    console.error('Error fetching game history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get board state at specific move
router.get('/games/:id/board-at-move/:moveIndex', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id)
    const moveIndex = parseInt(req.params.moveIndex)

    const game = await db
      .select({ moveHistory: games.moveHistory })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)

    if (!game.length) {
      return res.status(404).json({ error: 'Game not found' })
    }

    const moveHistory = (game[0].moveHistory as Move[]) || []

    if (moveIndex < -1 || moveIndex >= moveHistory.length) {
      return res.status(400).json({ error: 'Invalid move index' })
    }

    // Reconstruct board state
    let board = createInitialBoard()

    for (let i = 0; i <= moveIndex; i++) {
      const move = moveHistory[i]
      if (move) {
        // Apply move
        board[move.to.row][move.to.col] = move.piece
        board[move.from.row][move.from.col] = null

        // Apply captures
        if (move.captured) {
          move.captured.forEach(pos => {
            board[pos.row][pos.col] = null
          })
        }
      }
    }

    res.json({
      boardState: board,
      moveIndex,
      move: moveIndex >= 0 ? moveHistory[moveIndex] : null,
    })
  } catch (error) {
    console.error('Error reconstructing board state:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Serialize game state for export
router.get('/games/:id/export', async (req, res) => {
  try {
    const gameId = parseInt(req.params.id)

    const game = await db.select().from(games).where(eq(games.id, gameId)).limit(1)

    if (!game.length) {
      return res.status(404).json({ error: 'Game not found' })
    }

    const gameData = game[0]

    // Get player information
    const host = await db
      .select({ username: users.username, displayName: users.displayName, rating: users.rating })
      .from(users)
      .where(eq(users.id, gameData.hostId))
      .limit(1)

    let guest = null
    if (gameData.guestId) {
      const guestData = await db
        .select({ username: users.username, displayName: users.displayName, rating: users.rating })
        .from(users)
        .where(eq(users.id, gameData.guestId))
        .limit(1)
      guest = guestData[0] || null
    }

    const exportData = {
      gameId: gameData.id,
      players: {
        host: { ...host[0], role: gameData.hostRole },
        guest: guest
          ? { ...guest, role: gameData.hostRole === 'attacker' ? 'defender' : 'attacker' }
          : null,
      },
      gameInfo: {
        status: gameData.status,
        timeControl: gameData.timeControl,
        winner: gameData.winner,
        winCondition: gameData.winCondition,
        createdAt: gameData.createdAt,
        completedAt: gameData.completedAt,
      },
      moves: gameData.moveHistory,
      finalBoardState: gameData.boardState,
    }

    res.json(exportData)
  } catch (error) {
    console.error('Error exporting game:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
