import type { BoardState, GameRole, Move, Position } from '@shared/schema'
import { createInitialBoard, isValidMove, calculateCaptures, checkWinCondition } from './game-logic'
import { HnefataflAI, createAIConfig, AI_PERSONALITIES } from '@shared/ai-engine'

export interface OfflineGame {
  id: string
  playerRole: GameRole
  aiRole: GameRole
  aiDifficulty: number
  aiPersonality: keyof typeof AI_PERSONALITIES
  boardState: BoardState
  moveHistory: Move[]
  currentPlayer: GameRole
  status: 'active' | 'completed' | 'paused'
  winner?: GameRole
  winCondition?: string
  createdAt: number
  updatedAt: number
  lastSyncedAt?: number
}

export interface OfflineGameHistory {
  games: OfflineGame[]
  totalGames: number
  wins: number
  losses: number
  draws: number
}

class OfflineGameStore {
  private dbName = 'viking-chess-offline'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private aiEngine: HnefataflAI | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create games store
        if (!db.objectStoreNames.contains('games')) {
          const gamesStore = db.createObjectStore('games', { keyPath: 'id' })
          gamesStore.createIndex('status', 'status', { unique: false })
          gamesStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Create game history store
        if (!db.objectStoreNames.contains('gameHistory')) {
          db.createObjectStore('gameHistory', { keyPath: 'id' })
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }

  async createOfflineGame(
    playerRole: GameRole,
    aiDifficulty: number = 5,
    aiPersonality: keyof typeof AI_PERSONALITIES = 'balanced'
  ): Promise<OfflineGame> {
    if (!this.db) throw new Error('Database not initialized')

    const game: OfflineGame = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerRole,
      aiRole: playerRole === 'attacker' ? 'defender' : 'attacker',
      aiDifficulty,
      aiPersonality,
      boardState: createInitialBoard(),
      moveHistory: [],
      currentPlayer: 'attacker', // Attackers always start
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Initialize AI engine for this game
    const aiConfig = createAIConfig(aiDifficulty, aiPersonality)
    this.aiEngine = new HnefataflAI(aiConfig)

    await this.saveGame(game)
    return game
  }

  async saveGame(game: OfflineGame): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')

      game.updatedAt = Date.now()
      const request = store.put(game)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getGame(gameId: string): Promise<OfflineGame | null> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.get(gameId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllGames(): Promise<OfflineGame[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getActiveGames(): Promise<OfflineGame[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games'], 'readonly')
      const store = transaction.objectStore('games')
      const index = store.index('status')
      const request = index.getAll('active')

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async makeMove(gameId: string, move: Move): Promise<OfflineGame> {
    const game = await this.getGame(gameId)
    if (!game) throw new Error('Game not found')
    if (game.status !== 'active') throw new Error('Game is not active')

    // Validate move
    if (!isValidMove(game.boardState, move.from, move.to, move.piece)) {
      throw new Error('Invalid move')
    }

    // Make the move
    const newBoard = [...game.boardState.map(row => [...row])]
    newBoard[move.to.row][move.to.col] = move.piece
    newBoard[move.from.row][move.from.col] = null

    // Calculate captures
    const captures = calculateCaptures(newBoard, move.to)
    if (captures.length > 0) {
      move.captured = captures
      captures.forEach(pos => {
        newBoard[pos.row][pos.col] = null
      })
    }

    // Update game state
    game.boardState = newBoard
    game.moveHistory.push(move)
    game.currentPlayer = game.currentPlayer === 'attacker' ? 'defender' : 'attacker'

    // Check win condition
    const winCondition = checkWinCondition(game.boardState)
    if (winCondition.winner) {
      game.status = 'completed'
      game.winner = winCondition.winner
      game.winCondition = winCondition.condition

      // Update game history statistics
      await this.updateGameHistory(game)
    }

    await this.saveGame(game)
    return game
  }

  async makeAIMove(gameId: string): Promise<OfflineGame> {
    const game = await this.getGame(gameId)
    if (!game) throw new Error('Game not found')
    if (game.status !== 'active') throw new Error('Game is not active')
    if (game.currentPlayer === game.playerRole) throw new Error('Not AI turn')

    // Initialize AI if not already done
    if (!this.aiEngine) {
      const aiConfig = createAIConfig(game.aiDifficulty, game.aiPersonality)
      this.aiEngine = new HnefataflAI(aiConfig)
    }

    // Get AI move
    const aiMove = await this.aiEngine.getBestMove(game.boardState, game.aiRole)
    if (!aiMove) throw new Error('AI could not find a move')

    // Make the AI move
    return await this.makeMove(gameId, aiMove)
  }

  async deleteGame(gameId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games'], 'readwrite')
      const store = transaction.objectStore('games')
      const request = store.delete(gameId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getGameHistory(): Promise<OfflineGameHistory> {
    const games = await this.getAllGames()
    const completedGames = games.filter(g => g.status === 'completed')

    let wins = 0
    let losses = 0
    let draws = 0

    completedGames.forEach(game => {
      if (game.winner === game.playerRole) {
        wins++
      } else if (game.winner && game.winner !== game.playerRole) {
        losses++
      } else {
        draws++
      }
    })

    return {
      games: completedGames,
      totalGames: completedGames.length,
      wins,
      losses,
      draws,
    }
  }

  private async updateGameHistory(game: OfflineGame): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['gameHistory'], 'readwrite')
      const store = transaction.objectStore('gameHistory')

      const historyEntry = {
        id: game.id,
        playerRole: game.playerRole,
        aiDifficulty: game.aiDifficulty,
        aiPersonality: game.aiPersonality,
        winner: game.winner,
        winCondition: game.winCondition,
        moveCount: game.moveHistory.length,
        duration: game.updatedAt - game.createdAt,
        completedAt: game.updatedAt,
      }

      const request = store.put(historyEntry)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['games', 'gameHistory', 'settings'], 'readwrite')

      let completed = 0
      const stores = ['games', 'gameHistory', 'settings']

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => {
          completed++
          if (completed === stores.length) {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })
    })
  }

  async exportGameData(): Promise<string> {
    const games = await this.getAllGames()
    const history = await this.getGameHistory()

    const exportData = {
      games,
      history,
      exportedAt: Date.now(),
      version: '1.0',
    }

    return JSON.stringify(exportData, null, 2)
  }

  async importGameData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData)

      if (data.games && Array.isArray(data.games)) {
        for (const game of data.games) {
          await this.saveGame(game)
        }
      }
    } catch (error) {
      throw new Error('Invalid import data format')
    }
  }
}

// Singleton instance
export const offlineGameStore = new OfflineGameStore()

// Initialize the store when the module is loaded
offlineGameStore.init().catch(console.error)
