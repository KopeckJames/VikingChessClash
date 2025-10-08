import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { storage } from './storage'
import { WSMessage, Game, ChatMessage, Move, BoardState, Position, PieceType } from '@shared/schema'

// Connection management interfaces
interface ClientConnection {
  ws: WebSocket
  userId: number
  gameId?: number
  lastPing: number
  isAlive: boolean
}

interface QueuedMessage {
  userId: number
  message: string
  timestamp: number
  attempts: number
}

interface GameRoom {
  gameId: number
  connections: Set<ClientConnection>
  spectators: Set<ClientConnection>
}

export class WebSocketManager {
  private wss: WebSocketServer
  private connections = new Map<WebSocket, ClientConnection>()
  private userConnections = new Map<number, ClientConnection>()
  private gameRooms = new Map<number, GameRoom>()
  private messageQueue = new Map<number, QueuedMessage[]>()
  private heartbeatInterval: NodeJS.Timeout
  private queueProcessInterval: NodeJS.Timeout

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      clientTracking: true,
    })

    this.setupWebSocketServer()
    this.startHeartbeat()
    this.startQueueProcessor()
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('New WebSocket connection established')

      const connection: ClientConnection = {
        ws,
        userId: 0, // Will be set when user joins
        lastPing: Date.now(),
        isAlive: true,
      }

      this.connections.set(ws, connection)

      // Set up connection handlers
      this.setupConnectionHandlers(ws, connection)
    })
  }

  private setupConnectionHandlers(ws: WebSocket, connection: ClientConnection) {
    // Handle incoming messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString())
        await this.handleMessage(connection, message)
      } catch (error) {
        console.error('WebSocket message error:', error)
        this.sendError(ws, 'Invalid message format')
      }
    })

    // Handle pong responses for heartbeat
    ws.on('pong', () => {
      connection.isAlive = true
      connection.lastPing = Date.now()
    })

    // Handle connection close
    ws.on('close', () => {
      this.handleDisconnection(connection)
    })

    // Handle connection errors
    ws.on('error', error => {
      console.error('WebSocket connection error:', error)
      this.handleDisconnection(connection)
    })
  }

  private async handleMessage(connection: ClientConnection, message: WSMessage) {
    switch (message.type) {
      case 'join_game':
        await this.handleJoinGame(connection, message.gameId, message.userId)
        break

      case 'make_move':
        await this.handleMakeMove(connection, message.gameId, message.move)
        break

      case 'send_chat':
        await this.handleSendChat(connection, message.gameId, message.message)
        break

      case 'resign_game':
        await this.handleResignGame(connection, message.gameId, message.userId)
        break

      default:
        this.sendError(connection.ws, 'Unknown message type')
    }
  }

  private async handleJoinGame(connection: ClientConnection, gameId: number, userId: number) {
    try {
      // Update connection info
      connection.userId = userId
      connection.gameId = gameId

      // Update user mappings
      this.userConnections.set(userId, connection)

      // Update user's last seen timestamp
      await storage.updateUserLastSeen(userId)

      // Add to game room
      if (!this.gameRooms.has(gameId)) {
        this.gameRooms.set(gameId, {
          gameId,
          connections: new Set(),
          spectators: new Set(),
        })
      }

      const room = this.gameRooms.get(gameId)!
      room.connections.add(connection)

      // Send current game state
      const game = await storage.getGame(gameId)
      if (game) {
        this.sendToConnection(connection, { type: 'game_update', game })

        // Send chat history
        const chatMessages = await storage.getGameChatMessages(gameId)
        const messagesWithSenders = await Promise.all(
          chatMessages.map(async msg => {
            const sender = await storage.getUser(msg.senderId)
            return { ...msg, senderName: sender?.displayName || 'Unknown' }
          })
        )

        this.sendToConnection(connection, {
          type: 'chat_history',
          messages: messagesWithSenders,
        })
      }

      // Process any queued messages for this user
      await this.processQueuedMessages(userId)

      console.log(`User ${userId} joined game ${gameId}`)
    } catch (error) {
      console.error('Error handling join game:', error)
      this.sendError(connection.ws, 'Failed to join game')
    }
  }

  private async handleMakeMove(connection: ClientConnection, gameId: number, move: Move) {
    try {
      const game = await storage.getGame(gameId)

      if (!game || game.status !== 'active') {
        this.sendError(connection.ws, 'Game is not active')
        return
      }

      // Validate that it's the player's turn
      const isHost = game.hostId === connection.userId
      const isGuest = game.guestId === connection.userId

      if (!isHost && !isGuest) {
        this.sendError(connection.ws, 'You are not a player in this game')
        return
      }

      const playerRole = isHost
        ? game.hostRole
        : game.hostRole === 'attacker'
          ? 'defender'
          : 'attacker'

      if (game.currentPlayer !== playerRole) {
        this.sendError(connection.ws, 'Not your turn')
        return
      }

      const board = game.boardState as BoardState

      if (this.isValidMove(board, move.from, move.to, move.piece)) {
        // Make the move
        board[move.to.row][move.to.col] = board[move.from.row][move.from.col]
        board[move.from.row][move.from.col] = null

        // Check for captures
        const captures = this.checkCaptures(board, move.to)
        captures.forEach(capture => {
          board[capture.row][capture.col] = null
        })

        // Update move history
        const moveHistory = (game.moveHistory as Move[]) || []
        moveHistory.push({ ...move, captured: captures, timestamp: Date.now() })

        // Switch turns
        const nextPlayer = game.currentPlayer === 'attacker' ? 'defender' : 'attacker'

        // Check win condition
        const { winner, condition } = this.checkWinCondition(board)

        const updates: any = {
          boardState: board,
          currentPlayer: nextPlayer,
          moveHistory,
        }

        if (winner) {
          updates.status = 'completed'
          updates.winnerId =
            winner === 'attacker'
              ? game.hostRole === 'attacker'
                ? game.hostId
                : game.guestId
              : game.hostRole === 'defender'
                ? game.hostId
                : game.guestId
          updates.winCondition = condition
          updates.completedAt = new Date()
        }

        const updatedGame = await storage.updateGame(gameId, updates)

        // Broadcast to all clients in the game room
        if (updatedGame) {
          this.broadcastToGameRoom(gameId, { type: 'game_update', game: updatedGame })
        }
      } else {
        this.sendError(connection.ws, 'Invalid move')
      }
    } catch (error) {
      console.error('Error handling move:', error)
      this.sendError(connection.ws, 'Failed to process move')
    }
  }

  private async handleSendChat(connection: ClientConnection, gameId: number, message: string) {
    try {
      if (!connection.userId) {
        this.sendError(connection.ws, 'User not authenticated')
        return
      }

      const chatMessage = await storage.addChatMessage({
        gameId,
        senderId: connection.userId,
        message,
      })

      const sender = await storage.getUser(connection.userId)
      if (sender) {
        const chatUpdate = {
          type: 'chat_message' as const,
          message: { ...chatMessage, senderName: sender.displayName },
        }

        this.broadcastToGameRoom(gameId, chatUpdate)
      }
    } catch (error) {
      console.error('Error handling chat message:', error)
      this.sendError(connection.ws, 'Failed to send message')
    }
  }

  private async handleResignGame(connection: ClientConnection, gameId: number, userId: number) {
    try {
      const game = await storage.getGame(gameId)

      if (!game || game.status !== 'active') {
        this.sendError(connection.ws, 'Game is not active')
        return
      }

      if (game.hostId !== userId && game.guestId !== userId) {
        this.sendError(connection.ws, 'You are not a player in this game')
        return
      }

      // Determine winner (the player who didn't resign)
      const winner = game.hostId === userId ? 'guest' : 'host'

      // Update game status
      const updatedGame = await storage.updateGame(gameId, {
        status: 'completed',
        winCondition: 'resignation',
        completedAt: new Date(),
      })

      if (updatedGame) {
        this.broadcastToGameRoom(gameId, { type: 'game_update', game: updatedGame })
      }
    } catch (error) {
      console.error('Error handling resignation:', error)
      this.sendError(connection.ws, 'Failed to process resignation')
    }
  }

  private handleDisconnection(connection: ClientConnection) {
    console.log(`Client disconnected: User ${connection.userId}`)

    // Remove from connections
    this.connections.delete(connection.ws)

    if (connection.userId) {
      this.userConnections.delete(connection.userId)
    }

    // Remove from game rooms
    if (connection.gameId) {
      const room = this.gameRooms.get(connection.gameId)
      if (room) {
        room.connections.delete(connection)
        room.spectators.delete(connection)

        // Clean up empty rooms
        if (room.connections.size === 0 && room.spectators.size === 0) {
          this.gameRooms.delete(connection.gameId)
        }
      }
    }
  }

  // Message queuing for offline users
  private queueMessage(userId: number, message: string) {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, [])
    }

    const queue = this.messageQueue.get(userId)!
    queue.push({
      userId,
      message,
      timestamp: Date.now(),
      attempts: 0,
    })

    // Limit queue size to prevent memory issues
    if (queue.length > 100) {
      queue.shift() // Remove oldest message
    }
  }

  private async processQueuedMessages(userId: number) {
    const queue = this.messageQueue.get(userId)
    if (!queue || queue.length === 0) return

    const connection = this.userConnections.get(userId)
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) return

    // Send all queued messages
    for (const queuedMessage of queue) {
      try {
        connection.ws.send(queuedMessage.message)
      } catch (error) {
        console.error('Failed to send queued message:', error)
      }
    }

    // Clear the queue
    this.messageQueue.delete(userId)
  }

  // Heartbeat mechanism
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach(ws => {
        const connection = this.connections.get(ws)
        if (!connection) return

        if (!connection.isAlive) {
          console.log('Terminating dead connection')
          ws.terminate()
          return
        }

        connection.isAlive = false
        ws.ping()
      })
    }, 30000) // 30 seconds
  }

  // Queue processor for retry logic
  private startQueueProcessor() {
    this.queueProcessInterval = setInterval(() => {
      for (const [userId, queue] of this.messageQueue.entries()) {
        const connection = this.userConnections.get(userId)

        if (connection && connection.ws.readyState === WebSocket.OPEN) {
          this.processQueuedMessages(userId)
        } else {
          // Remove old messages (older than 1 hour)
          const oneHourAgo = Date.now() - 60 * 60 * 1000
          const filteredQueue = queue.filter(msg => msg.timestamp > oneHourAgo)

          if (filteredQueue.length !== queue.length) {
            if (filteredQueue.length === 0) {
              this.messageQueue.delete(userId)
            } else {
              this.messageQueue.set(userId, filteredQueue)
            }
          }
        }
      }
    }, 60000) // 1 minute
  }

  // Broadcasting methods
  private broadcastToGameRoom(gameId: number, message: WSMessage) {
    const room = this.gameRooms.get(gameId)
    if (!room) return

    const messageStr = JSON.stringify(message)

    // Broadcast to all connections in the room
    ;[...room.connections, ...room.spectators].forEach(connection => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr)
      } else {
        // Queue message for offline users
        if (connection.userId) {
          this.queueMessage(connection.userId, messageStr)
        }
      }
    })
  }

  private sendToConnection(connection: ClientConnection, message: WSMessage) {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message))
    } else if (connection.userId) {
      this.queueMessage(connection.userId, JSON.stringify(message))
    }
  }

  private sendError(ws: WebSocket, message: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message }))
    }
  }

  // Game logic methods (moved from routes.ts)
  private isValidMove(board: BoardState, from: Position, to: Position, piece: PieceType): boolean {
    if (!piece || (from.row === to.row && from.col === to.col)) return false

    // Check bounds
    if (to.row < 0 || to.row >= 11 || to.col < 0 || to.col >= 11) return false

    // Check if destination is empty
    if (board[to.row][to.col] !== null) return false

    // Check if path is clear (pieces move in straight lines)
    if (from.row !== to.row && from.col !== to.col) return false

    const rowDir = to.row > from.row ? 1 : to.row < from.row ? -1 : 0
    const colDir = to.col > from.col ? 1 : to.col < from.col ? -1 : 0

    let checkRow = from.row + rowDir
    let checkCol = from.col + colDir

    while (checkRow !== to.row || checkCol !== to.col) {
      if (board[checkRow][checkCol] !== null) return false
      checkRow += rowDir
      checkCol += colDir
    }

    return true
  }

  private checkCaptures(board: BoardState, position: Position): Position[] {
    const captures: Position[] = []
    const piece = board[position.row][position.col]

    if (!piece) return captures

    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]

    for (const [dr, dc] of directions) {
      const adjacentRow = position.row + dr
      const adjacentCol = position.col + dc
      const oppositeRow = position.row + dr * 2
      const oppositeCol = position.col + dc * 2

      // Check bounds
      if (adjacentRow < 0 || adjacentRow >= 11 || adjacentCol < 0 || adjacentCol >= 11) continue
      if (oppositeRow < 0 || oppositeRow >= 11 || oppositeCol < 0 || oppositeCol >= 11) continue

      const adjacentPiece = board[adjacentRow][adjacentCol]
      const oppositePiece = board[oppositeRow][oppositeCol]

      // Regular capture rules
      if (adjacentPiece && adjacentPiece !== piece) {
        if (piece === 'attacker' && (adjacentPiece === 'defender' || adjacentPiece === 'king')) {
          if (
            oppositePiece === piece ||
            (oppositeRow === 5 && oppositeCol === 5) ||
            this.isCornerSquare(oppositeRow, oppositeCol)
          ) {
            captures.push({ row: adjacentRow, col: adjacentCol })
          }
        } else if ((piece === 'defender' || piece === 'king') && adjacentPiece === 'attacker') {
          if (
            oppositePiece === 'defender' ||
            oppositePiece === 'king' ||
            oppositePiece === piece ||
            (oppositeRow === 5 && oppositeCol === 5) ||
            this.isCornerSquare(oppositeRow, oppositeCol)
          ) {
            captures.push({ row: adjacentRow, col: adjacentCol })
          }
        }
      }
    }

    return captures
  }

  private isCornerSquare(row: number, col: number): boolean {
    return (
      (row === 0 && col === 0) ||
      (row === 0 && col === 10) ||
      (row === 10 && col === 0) ||
      (row === 10 && col === 10)
    )
  }

  private checkWinCondition(board: BoardState): {
    winner: 'attacker' | 'defender' | null
    condition: string | null
  } {
    // Find the king
    let kingPosition: { row: number; col: number } | null = null

    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        if (board[row][col] === 'king') {
          kingPosition = { row, col }
          break
        }
      }
      if (kingPosition) break
    }

    // King captured (not found on board)
    if (!kingPosition) {
      return { winner: 'attacker', condition: 'king_captured' }
    }

    // King escaped (reached corner)
    if (this.isCornerSquare(kingPosition.row, kingPosition.col)) {
      return { winner: 'defender', condition: 'king_escape' }
    }

    // Check if king is surrounded by attackers (captured but still on board)
    if (this.isKingSurrounded(board, kingPosition)) {
      return { winner: 'attacker', condition: 'king_captured' }
    }

    // Game continues
    return { winner: null, condition: null }
  }

  private isKingSurrounded(board: BoardState, kingPos: { row: number; col: number }): boolean {
    const { row, col } = kingPos
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]

    // Special case: King on throne (center) - needs all 4 sides
    if (row === 5 && col === 5) {
      for (const [dr, dc] of directions) {
        const newRow = row + dr
        const newCol = col + dc
        if (newRow >= 0 && newRow < 11 && newCol >= 0 && newCol < 11) {
          if (board[newRow][newCol] !== 'attacker') {
            return false
          }
        }
      }
      return true
    }

    // Special case: King adjacent to throne - needs all accessible sides
    const isAdjacentToThrone = Math.abs(row - 5) + Math.abs(col - 5) === 1
    if (isAdjacentToThrone) {
      let surroundedSides = 0
      let totalSides = 0

      for (const [dr, dc] of directions) {
        const newRow = row + dr
        const newCol = col + dc

        if (newRow >= 0 && newRow < 11 && newCol >= 0 && newCol < 11) {
          totalSides++
          if (board[newRow][newCol] === 'attacker' || (newRow === 5 && newCol === 5)) {
            surroundedSides++
          }
        } else {
          totalSides++
          surroundedSides++
        }
      }

      return surroundedSides === totalSides
    }

    // King on wall: needs 3 attackers (wall acts as 4th side)
    const isOnWall = row === 0 || row === 10 || col === 0 || col === 10
    if (isOnWall) {
      let attackerCount = 0
      let requiredAttackers = 3

      for (const [dr, dc] of directions) {
        const newRow = row + dr
        const newCol = col + dc

        if (newRow >= 0 && newRow < 11 && newCol >= 0 && newCol < 11) {
          if (board[newRow][newCol] === 'attacker') {
            attackerCount++
          }
        }
      }

      return attackerCount >= requiredAttackers
    }

    // King not on wall: needs all 4 sides surrounded
    let surroundedSides = 0

    for (const [dr, dc] of directions) {
      const newRow = row + dr
      const newCol = col + dc

      if (newRow >= 0 && newRow < 11 && newCol >= 0 && newCol < 11) {
        if (board[newRow][newCol] === 'attacker') {
          surroundedSides++
        }
      }
    }

    return surroundedSides === 4
  }

  // Public methods for external use
  public addSpectator(gameId: number, userId: number, ws: WebSocket) {
    const connection: ClientConnection = {
      ws,
      userId,
      gameId,
      lastPing: Date.now(),
      isAlive: true,
    }

    this.connections.set(ws, connection)
    this.userConnections.set(userId, connection)

    if (!this.gameRooms.has(gameId)) {
      this.gameRooms.set(gameId, {
        gameId,
        connections: new Set(),
        spectators: new Set(),
      })
    }

    const room = this.gameRooms.get(gameId)!
    room.spectators.add(connection)

    this.setupConnectionHandlers(ws, connection)
  }

  public getConnectionCount(): number {
    return this.connections.size
  }

  public getGameRoomCount(): number {
    return this.gameRooms.size
  }

  public cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    if (this.queueProcessInterval) {
      clearInterval(this.queueProcessInterval)
    }
    this.wss.close()
  }
}
