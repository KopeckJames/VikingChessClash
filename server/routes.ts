import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertGameSchema, insertChatMessageSchema, type WSMessage, type Move, type Position, type PieceType, type BoardState } from "@shared/schema";
import { z } from "zod";

// Game logic functions
function isValidMove(board: BoardState, from: Position, to: Position, piece: PieceType): boolean {
  if (!piece || from.row === to.row && from.col === to.col) return false;
  
  // Check bounds
  if (to.row < 0 || to.row >= 11 || to.col < 0 || to.col >= 11) return false;
  
  // Check if destination is empty
  if (board[to.row][to.col] !== null) return false;
  
  // Check if path is clear (pieces move in straight lines)
  if (from.row !== to.row && from.col !== to.col) return false;
  
  const rowDir = to.row > from.row ? 1 : to.row < from.row ? -1 : 0;
  const colDir = to.col > from.col ? 1 : to.col < from.col ? -1 : 0;
  
  let checkRow = from.row + rowDir;
  let checkCol = from.col + colDir;
  
  while (checkRow !== to.row || checkCol !== to.col) {
    if (board[checkRow][checkCol] !== null) return false;
    checkRow += rowDir;
    checkCol += colDir;
  }
  
  return true;
}

function checkCaptures(board: BoardState, position: Position): Position[] {
  const captures: Position[] = [];
  const piece = board[position.row][position.col];
  
  if (!piece) return captures;
  
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [dr, dc] of directions) {
    const adjacentRow = position.row + dr;
    const adjacentCol = position.col + dc;
    const oppositeRow = position.row + dr * 2;
    const oppositeCol = position.col + dc * 2;
    
    // Check bounds
    if (adjacentRow < 0 || adjacentRow >= 11 || adjacentCol < 0 || adjacentCol >= 11) continue;
    if (oppositeRow < 0 || oppositeRow >= 11 || oppositeCol < 0 || oppositeCol >= 11) continue;
    
    const adjacentPiece = board[adjacentRow][adjacentCol];
    const oppositePiece = board[oppositeRow][oppositeCol];
    
    // Regular capture rules (simplified)
    if (adjacentPiece && adjacentPiece !== piece) {
      if ((piece === "attacker" && (adjacentPiece === "defender" || adjacentPiece === "king")) ||
          ((piece === "defender" || piece === "king") && adjacentPiece === "attacker")) {
        if (oppositePiece === piece || (oppositeRow === 5 && oppositeCol === 5) || 
            isCornerSquare(oppositeRow, oppositeCol)) {
          captures.push({ row: adjacentRow, col: adjacentCol });
        }
      }
    }
  }
  
  return captures;
}

function isCornerSquare(row: number, col: number): boolean {
  return (row === 0 && col === 0) || (row === 0 && col === 10) ||
         (row === 10 && col === 0) || (row === 10 && col === 10);
}

function checkWinCondition(board: BoardState): { winner: "attacker" | "defender" | null; condition: string | null } {
  // Check if king escaped (reached corner)
  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 11; col++) {
      if (board[row][col] === "king") {
        if (isCornerSquare(row, col)) {
          return { winner: "defender", condition: "king_escape" };
        }
        // King is still on board, check if captured
        return { winner: null, condition: null };
      }
    }
  }
  
  // King not found = captured
  return { winner: "attacker", condition: "king_captured" };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time game updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const gameRooms = new Map<number, Set<WebSocket>>();
  const userSockets = new Map<number, WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_game':
            const { gameId, userId } = message;
            userSockets.set(userId, ws);
            
            if (!gameRooms.has(gameId)) {
              gameRooms.set(gameId, new Set());
            }
            gameRooms.get(gameId)!.add(ws);
            
            // Send current game state
            const game = await storage.getGame(gameId);
            if (game) {
              ws.send(JSON.stringify({ type: 'game_update', game }));
            }
            break;
            
          case 'make_move':
            const { gameId: moveGameId, move } = message;
            const gameToUpdate = await storage.getGame(moveGameId);
            
            if (gameToUpdate && gameToUpdate.status === 'active') {
              const board = gameToUpdate.boardState as BoardState;
              
              if (isValidMove(board, move.from, move.to, move.piece)) {
                // Make the move
                board[move.to.row][move.to.col] = board[move.from.row][move.from.col];
                board[move.from.row][move.from.col] = null;
                
                // Check for captures
                const captures = checkCaptures(board, move.to);
                captures.forEach(capture => {
                  board[capture.row][capture.col] = null;
                });
                
                // Update move history
                const moveHistory = (gameToUpdate.moveHistory as Move[]) || [];
                moveHistory.push({ ...move, captured: captures });
                
                // Switch turns
                const nextPlayer = gameToUpdate.currentPlayer === 'attacker' ? 'defender' : 'attacker';
                
                // Check win condition
                const { winner, condition } = checkWinCondition(board);
                
                const updates: any = {
                  boardState: board,
                  currentPlayer: nextPlayer,
                  moveHistory,
                };
                
                if (winner) {
                  updates.status = 'completed';
                  updates.winnerId = winner === 'attacker' ? 
                    (gameToUpdate.hostRole === 'attacker' ? gameToUpdate.hostId : gameToUpdate.guestId) :
                    (gameToUpdate.hostRole === 'defender' ? gameToUpdate.hostId : gameToUpdate.guestId);
                  updates.winCondition = condition;
                  updates.completedAt = new Date();
                }
                
                const updatedGame = await storage.updateGame(moveGameId, updates);
                
                // Broadcast to all clients in the game room
                const room = gameRooms.get(moveGameId);
                if (room && updatedGame) {
                  const updateMessage = JSON.stringify({ type: 'game_update', game: updatedGame });
                  room.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(updateMessage);
                    }
                  });
                }
              }
            }
            break;
            
          case 'send_chat':
            const { gameId: chatGameId, message: chatText } = message;
            // Get the user ID for the current WebSocket connection
            let senderId = 1; // Default to user 1
            for (const [userId, socket] of Array.from(userSockets.entries())) {
              if (socket === ws) {
                senderId = userId;
                break;
              }
            }
            
            const chatMessage = await storage.addChatMessage({
              gameId: chatGameId,
              senderId,
              message: chatText,
            });
            
            const sender = await storage.getUser(senderId);
            if (sender) {
              const chatUpdate = {
                type: 'chat_message',
                message: { ...chatMessage, senderName: sender.displayName }
              };
              
              const room = gameRooms.get(chatGameId);
              if (room) {
                const chatUpdateMessage = JSON.stringify(chatUpdate);
                room.forEach(client => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(chatUpdateMessage);
                  }
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      // Clean up user socket mapping
      for (const [userId, socket] of Array.from(userSockets.entries())) {
        if (socket === ws) {
          userSockets.delete(userId);
          break;
        }
      }
      
      // Remove from game rooms
      gameRooms.forEach(room => room.delete(ws));
    });
  });

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, displayName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password, // In production, hash the password
        displayName,
        rating: 1200,
        wins: 0,
        losses: 0
      });

      res.json({ id: user.id, username: user.username, displayName: user.displayName, rating: user.rating });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) { // In production, use proper password hashing
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      res.json({ id: user.id, username: user.username, displayName: user.displayName, rating: user.rating });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    // For now, return user data from client session
    // In production, implement proper session management
    res.json({ user: null });
  });

  // REST API routes
  app.get('/api/games/waiting', async (req, res) => {
    try {
      const games = await storage.getWaitingGames();
      const gamesWithHosts = await Promise.all(
        games.map(async (game) => {
          const host = await storage.getUser(game.hostId);
          return {
            ...game,
            hostName: host?.displayName || 'Unknown',
            hostRating: host?.rating || 0,
          };
        })
      );
      res.json(gamesWithHosts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch waiting games' });
    }
  });

  app.post('/api/games/create', async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      
      // Create initial board state
      const initialBoard: BoardState = Array(11).fill(null).map(() => Array(11).fill(null));
      
      // Place pieces (simplified initial setup)
      // Attackers
      const attackerPositions = [
        [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
        [3, 0], [4, 0], [5, 0], [6, 0], [7, 0],
        [3, 10], [4, 10], [5, 10], [6, 10], [7, 10],
        [10, 3], [10, 4], [10, 5], [10, 6], [10, 7],
        [1, 5], [9, 5], [5, 1], [5, 9]
      ];
      
      attackerPositions.forEach(([row, col]) => {
        initialBoard[row][col] = "attacker";
      });
      
      // Defenders
      const defenderPositions = [
        [3, 5], [4, 4], [4, 5], [4, 6], [5, 3], [5, 4], [5, 6], [5, 7],
        [6, 4], [6, 5], [6, 6], [7, 5]
      ];
      
      defenderPositions.forEach(([row, col]) => {
        initialBoard[row][col] = "defender";
      });
      
      // King
      initialBoard[5][5] = "king";
      
      const game = await storage.createGame({
        ...gameData,
        boardState: initialBoard,
        moveHistory: [],
        status: "waiting", // Games start as waiting until joined
      });
      
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid game data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create game' });
      }
    }
  });

  app.post('/api/games/:id/join', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const { userId } = req.body;
      
      const game = await storage.joinGame(gameId, userId);
      if (game) {
        // Notify all clients in the game room about the game update
        const room = gameRooms.get(gameId);
        if (room) {
          const updateMessage = JSON.stringify({ type: 'game_update', game });
          room.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(updateMessage);
            }
          });
        }

        // Also update the waiting games list for all lobby users
        const allConnectedUsers = Array.from(userSockets.values());
        const lobbyUpdateMessage = JSON.stringify({ type: 'lobby_update' });
        allConnectedUsers.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(lobbyUpdateMessage);
          }
        });
        
        res.json(game);
      } else {
        res.status(400).json({ message: 'Unable to join game' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to join game' });
    }
  });

  app.get('/api/games/:id', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (game) {
        res.json(game);
      } else {
        res.status(404).json({ message: 'Game not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch game' });
    }
  });

  app.get('/api/games/:id/chat', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const messages = await storage.getGameChatMessages(gameId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (user) {
        // Don't send password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  return httpServer;
}
