import type { Express } from 'express'
import { createServer, type Server } from 'http'
import { storage } from './storage'
import {
  insertGameSchema,
  insertChatMessageSchema,
  type Move,
  type Position,
  type PieceType,
  type BoardState,
} from '@shared/schema'
import { calculateEloRating, getRankByRating } from '@shared/rating-system'
import { z } from 'zod'
import gameApiRoutes from './game-api'
import { WebSocketManager } from './websocket'

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app)

  // Register game API routes
  app.use('/api', gameApiRoutes)

  // Initialize WebSocket manager
  const wsManager = new WebSocketManager(httpServer)

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, displayName } = req.body

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username)
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' })
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password, // In production, hash the password
        displayName,
        rating: 1200,
        wins: 0,
        losses: 0,
      })

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        rating: user.rating,
      })
    } catch (error) {
      res.status(500).json({ message: 'Failed to create account' })
    }
  })

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body

      const user = await storage.getUserByUsername(username)
      if (!user || user.password !== password) {
        // In production, use proper password hashing
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        rating: user.rating,
      })
    } catch (error) {
      res.status(500).json({ message: 'Login failed' })
    }
  })

  app.get('/api/auth/me', async (req, res) => {
    // For now, return user data from client session
    // In production, implement proper session management
    res.json({ user: null })
  })

  app.post('/api/auth/logout', async (req, res) => {
    try {
      const { userId } = req.body

      if (userId) {
        // Update user's last seen timestamp on logout
        await storage.updateUserLastSeen(userId)
      }

      res.json({ message: 'Logged out successfully' })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({ message: 'Logout failed' })
    }
  })

  // REST API routes
  app.get('/api/users/stats', async (req, res) => {
    try {
      const stats = await storage.getUserStats()
      res.json(stats)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user statistics' })
    }
  })

  app.get('/api/games/waiting', async (req, res) => {
    try {
      const games = await storage.getWaitingGames()
      const gamesWithHosts = await Promise.all(
        games.map(async game => {
          const host = await storage.getUser(game.hostId)
          return {
            ...game,
            hostName: host?.displayName || 'Unknown',
            hostRating: host?.rating || 0,
          }
        })
      )
      res.json(gamesWithHosts)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch waiting games' })
    }
  })

  app.post('/api/games/create', async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body)

      // Create initial board state
      const initialBoard: BoardState = Array(11)
        .fill(null)
        .map(() => Array(11).fill(null))

      // Place pieces (simplified initial setup)
      // Attackers
      const attackerPositions = [
        [0, 3],
        [0, 4],
        [0, 5],
        [0, 6],
        [0, 7],
        [3, 0],
        [4, 0],
        [5, 0],
        [6, 0],
        [7, 0],
        [3, 10],
        [4, 10],
        [5, 10],
        [6, 10],
        [7, 10],
        [10, 3],
        [10, 4],
        [10, 5],
        [10, 6],
        [10, 7],
        [1, 5],
        [9, 5],
        [5, 1],
        [5, 9],
      ]

      attackerPositions.forEach(([row, col]) => {
        initialBoard[row][col] = 'attacker'
      })

      // Defenders
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
        initialBoard[row][col] = 'defender'
      })

      // King
      initialBoard[5][5] = 'king'

      const game = await storage.createGame({
        ...gameData,
        boardState: initialBoard,
        moveHistory: [],
        status: 'waiting', // Games start as waiting until joined
      })

      res.json(game)
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid game data', errors: error.errors })
      } else {
        res.status(500).json({ message: 'Failed to create game' })
      }
    }
  })

  app.post('/api/games/:id/join', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id)
      const { userId } = req.body

      const game = await storage.joinGame(gameId, userId)
      if (game) {
        res.json(game)
      } else {
        res.status(400).json({ message: 'Unable to join game' })
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to join game' })
    }
  })

  app.get('/api/games/:id', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id)
      const game = await storage.getGame(gameId)

      if (game) {
        res.json(game)
      } else {
        res.status(404).json({ message: 'Game not found' })
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch game' })
    }
  })

  app.get('/api/games/:id/chat', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id)
      const messages = await storage.getGameChatMessages(gameId)
      res.json(messages)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chat messages' })
    }
  })

  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id)
      const user = await storage.getUser(userId)

      if (user) {
        // Don't send password
        const { password, ...userWithoutPassword } = user
        res.json(userWithoutPassword)
      } else {
        res.status(404).json({ message: 'User not found' })
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' })
    }
  })

  // Get leaderboard
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const period = (req.query.period as 'all' | 'month' | 'week') || 'all'
      const leaderboard = await storage.getLeaderboard(period)
      res.json(leaderboard)
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch leaderboard' })
    }
  })

  return httpServer
}
