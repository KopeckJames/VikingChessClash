import { HnefataflAI, createAIConfig, AI_PERSONALITIES } from '../shared/ai-engine'
import type { BoardState, GameRole, Move, AIOpponent, Game } from '../shared/schema'
import { db } from './db'
import { aiOpponents, aiGames, games, users } from '../shared/schema'
import { eq, and } from 'drizzle-orm'

export class AIService {
  private aiInstances: Map<number, HnefataflAI> = new Map()

  /**
   * Initialize default AI opponents
   */
  async initializeAIOpponents(): Promise<void> {
    const existingAI = await db.select().from(aiOpponents).limit(1)
    if (existingAI.length > 0) return // Already initialized

    const defaultOpponents = [
      // Beginner AIs
      {
        name: 'Viking Novice',
        difficulty: 2,
        rating: 800,
        personality: 'balanced' as const,
        avatar: '🛡️',
        thinkingTime: 1000,
      },
      {
        name: 'Shield Bearer',
        difficulty: 3,
        rating: 950,
        personality: 'defensive' as const,
        avatar: '🛡️',
        thinkingTime: 1500,
      },

      // Intermediate AIs
      {
        name: 'Berserker',
        difficulty: 5,
        rating: 1200,
        personality: 'aggressive' as const,
        avatar: '⚔️',
        thinkingTime: 2000,
      },
      {
        name: 'Tactician',
        difficulty: 6,
        rating: 1350,
        personality: 'balanced' as const,
        avatar: '🧠',
        thinkingTime: 2500,
      },
      {
        name: 'Guardian',
        difficulty: 6,
        rating: 1300,
        personality: 'defensive' as const,
        avatar: '🏰',
        thinkingTime: 2500,
      },

      // Advanced AIs
      {
        name: 'Warlord',
        difficulty: 8,
        rating: 1600,
        personality: 'aggressive' as const,
        avatar: '👑',
        thinkingTime: 3500,
      },
      {
        name: 'Strategist',
        difficulty: 8,
        rating: 1650,
        personality: 'balanced' as const,
        avatar: '🎯',
        thinkingTime: 3500,
      },

      // Expert AIs
      {
        name: 'Grandmaster',
        difficulty: 10,
        rating: 1900,
        personality: 'balanced' as const,
        avatar: '👑',
        thinkingTime: 4500,
      },
      {
        name: 'Iron Fortress',
        difficulty: 9,
        rating: 1750,
        personality: 'defensive' as const,
        avatar: '🏛️',
        thinkingTime: 4000,
      },
      {
        name: 'Blood Eagle',
        difficulty: 9,
        rating: 1800,
        personality: 'aggressive' as const,
        avatar: '🦅',
        thinkingTime: 4000,
      },
    ]

    for (const opponent of defaultOpponents) {
      await db.insert(aiOpponents).values({
        ...opponent,
        strategy: AI_PERSONALITIES[opponent.personality],
      })
    }
  }

  /**
   * Get all available AI opponents
   */
  async getAIOpponents(): Promise<AIOpponent[]> {
    return await db.select().from(aiOpponents)
  }

  /**
   * Get AI opponent by ID
   */
  async getAIOpponent(id: number): Promise<AIOpponent | null> {
    const result = await db.select().from(aiOpponents).where(eq(aiOpponents.id, id))
    return result[0] || null
  }

  /**
   * Get AI opponent by difficulty range
   */
  async getAIOpponentByDifficulty(
    minDifficulty: number,
    maxDifficulty: number
  ): Promise<AIOpponent[]> {
    return await db
      .select()
      .from(aiOpponents)
      .where(
        and(eq(aiOpponents.difficulty, minDifficulty), eq(aiOpponents.difficulty, maxDifficulty))
      )
  }

  /**
   * Create a game against AI
   */
  async createAIGame(
    userId: number,
    aiOpponentId: number,
    userRole: GameRole,
    timeControl: string = '15+10'
  ): Promise<{ game: Game; aiOpponent: AIOpponent } | null> {
    const aiOpponent = await this.getAIOpponent(aiOpponentId)
    if (!aiOpponent) return null

    // Create the game
    const gameData = {
      hostId: userId,
      guestId: null, // AI doesn't have a user ID
      status: 'active' as const,
      currentPlayer: 'attacker' as const,
      boardState: this.createInitialBoard(),
      hostRole: userRole,
      timeControl,
      moveHistory: [],
    }

    const [game] = await db.insert(games).values(gameData).returning()

    // Create AI game record
    await db.insert(aiGames).values({
      gameId: game.id,
      aiOpponentId: aiOpponent.id,
      aiRole: userRole === 'attacker' ? 'defender' : 'attacker',
      difficulty: aiOpponent.difficulty,
    })

    // Initialize AI instance
    const aiConfig = createAIConfig(aiOpponent.difficulty, aiOpponent.personality as any)
    aiConfig.thinkingTime = aiOpponent.thinkingTime
    this.aiInstances.set(game.id, new HnefataflAI(aiConfig))

    return { game, aiOpponent }
  }

  /**
   * Get AI move for a game
   */
  async getAIMove(gameId: number): Promise<Move | null> {
    // Get game and AI info
    const gameResult = await db
      .select({
        game: games,
        aiGame: aiGames,
        aiOpponent: aiOpponents,
      })
      .from(games)
      .innerJoin(aiGames, eq(games.id, aiGames.gameId))
      .innerJoin(aiOpponents, eq(aiGames.aiOpponentId, aiOpponents.id))
      .where(eq(games.id, gameId))

    if (gameResult.length === 0) return null

    const { game, aiGame, aiOpponent } = gameResult[0]

    // Get or create AI instance
    let ai = this.aiInstances.get(gameId)
    if (!ai) {
      const aiConfig = createAIConfig(aiOpponent.difficulty, aiOpponent.personality as any)
      aiConfig.thinkingTime = aiOpponent.thinkingTime
      ai = new HnefataflAI(aiConfig)
      this.aiInstances.set(gameId, ai)
    }

    // Get the best move
    const board = game.boardState as BoardState
    const aiRole = aiGame.aiRole as GameRole

    return await ai.getBestMove(board, aiRole)
  }

  /**
   * Update AI opponent statistics after game
   */
  async updateAIStats(aiOpponentId: number, result: 'win' | 'loss' | 'draw'): Promise<void> {
    const aiOpponent = await this.getAIOpponent(aiOpponentId)
    if (!aiOpponent) return

    const updates: any = {
      gamesPlayed: aiOpponent.gamesPlayed + 1,
      updatedAt: new Date(),
    }

    switch (result) {
      case 'win':
        updates.wins = aiOpponent.wins + 1
        break
      case 'loss':
        updates.losses = aiOpponent.losses + 1
        break
      case 'draw':
        updates.draws = aiOpponent.draws + 1
        break
    }

    await db.update(aiOpponents).set(updates).where(eq(aiOpponents.id, aiOpponentId))
  }

  /**
   * Clean up AI instance when game ends
   */
  cleanupAIInstance(gameId: number): void {
    this.aiInstances.delete(gameId)
  }

  /**
   * Check if a game is against AI
   */
  async isAIGame(gameId: number): Promise<boolean> {
    const result = await db.select().from(aiGames).where(eq(aiGames.gameId, gameId))
    return result.length > 0
  }

  /**
   * Get AI game info
   */
  async getAIGameInfo(
    gameId: number
  ): Promise<{ aiOpponent: AIOpponent; aiRole: GameRole } | null> {
    const result = await db
      .select({
        aiOpponent: aiOpponents,
        aiRole: aiGames.aiRole,
      })
      .from(aiGames)
      .innerJoin(aiOpponents, eq(aiGames.aiOpponentId, aiOpponents.id))
      .where(eq(aiGames.gameId, gameId))

    if (result.length === 0) return null

    return {
      aiOpponent: result[0].aiOpponent,
      aiRole: result[0].aiRole as GameRole,
    }
  }

  /**
   * Create initial board state
   */
  private createInitialBoard(): BoardState {
    const board: BoardState = Array(11)
      .fill(null)
      .map(() => Array(11).fill(null))

    // Place attackers around the edges
    const attackerPositions = [
      // Top row
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
      [0, 7],
      // Left side
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 0],
      [7, 0],
      // Right side
      [3, 10],
      [4, 10],
      [5, 10],
      [6, 10],
      [7, 10],
      // Bottom row
      [10, 3],
      [10, 4],
      [10, 5],
      [10, 6],
      [10, 7],
      // Second row/column from edges
      [1, 5],
      [9, 5],
      [5, 1],
      [5, 9],
    ]

    attackerPositions.forEach(([row, col]) => {
      board[row][col] = 'attacker'
    })

    // Place defenders around the center
    const defenderPositions = [
      [3, 5],
      [4, 4],
      [4, 5],
      [4, 6],
      [5, 3],
      [5, 4],
      [5, 6],
      [5, 7],
      [6, 4],
      [6, 5],
      [6, 6],
      [7, 5],
    ]

    defenderPositions.forEach(([row, col]) => {
      board[row][col] = 'defender'
    })

    // Place king in the center (throne)
    board[5][5] = 'king'

    return board
  }
}

// Singleton instance
export const aiService = new AIService()
