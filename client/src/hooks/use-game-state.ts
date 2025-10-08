import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WebSocketManager } from '@/lib/websocket'
import type { Game, Move, WSMessage, BoardState } from '@shared/schema'

// Game state management with TanStack Query
export function useGameState(gameId: number, socket: WebSocketManager | null) {
  const [latestChatMessage, setLatestChatMessage] = useState<any>(null)
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const queryClient = useQueryClient()

  // Fetch game data with TanStack Query
  const {
    data: gameState,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch game')
      }
      return response.json() as Promise<Game>
    },
    enabled: !!gameId,
    refetchInterval: 5000, // Fallback polling every 5 seconds
  })

  // Move validation mutation
  const validateMoveMutation = useMutation({
    mutationFn: async (move: Move) => {
      const response = await fetch(`/api/games/${gameId}/validate-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Invalid move')
      }

      return response.json()
    },
  })

  // Make move mutation
  const makeMoveMutation = useMutation({
    mutationFn: async (move: Move) => {
      const response = await fetch(`/api/games/${gameId}/moves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to make move')
      }

      return response.json()
    },
    onSuccess: data => {
      // Update the game state in cache
      queryClient.setQueryData(['game', gameId], data.game)
      // Add move to history
      setMoveHistory(prev => [...prev, data.move])
      setCurrentMoveIndex(prev => prev + 1)
    },
  })

  // WebSocket event handlers
  useEffect(() => {
    if (!socket) return

    const handleGameUpdate = (message: WSMessage) => {
      if (message.type === 'game_update') {
        // Update the cached game state
        queryClient.setQueryData(['game', gameId], message.game)

        // Update move history if needed
        const newMoveHistory = (message.game.moveHistory as Move[]) || []
        setMoveHistory(newMoveHistory)
        setCurrentMoveIndex(newMoveHistory.length - 1)
      }
    }

    const handleChatMessage = (message: WSMessage) => {
      if (message.type === 'chat_message') {
        setLatestChatMessage(message.message)
      }
    }

    const handleError = (message: WSMessage) => {
      if (message.type === 'error') {
        console.error('WebSocket error:', message.message)
      }
    }

    socket.on('game_update', handleGameUpdate)
    socket.on('chat_message', handleChatMessage)
    socket.on('error', handleError)

    return () => {
      socket.off('game_update', handleGameUpdate)
      socket.off('chat_message', handleChatMessage)
      socket.off('error', handleError)
    }
  }, [socket, gameId, queryClient])

  // Make move function with validation
  const makeMove = useCallback(
    async (move: Move) => {
      try {
        // First validate the move
        await validateMoveMutation.mutateAsync(move)

        // If validation passes, make the move
        await makeMoveMutation.mutateAsync(move)

        // Also send via WebSocket for real-time updates
        if (socket && gameId) {
          socket.send({
            type: 'make_move',
            gameId,
            move,
          })
        }
      } catch (error) {
        console.error('Failed to make move:', error)
        throw error
      }
    },
    [validateMoveMutation, makeMoveMutation, socket, gameId]
  )

  const sendChatMessage = useCallback(
    (message: string) => {
      if (socket && gameId) {
        socket.send({
          type: 'send_chat',
          gameId,
          message,
        })
      }
    },
    [socket, gameId]
  )

  // Game replay functionality
  const getBoardStateAtMove = useCallback(
    (moveIndex: number): BoardState | null => {
      if (!gameState || moveIndex < -1 || moveIndex >= moveHistory.length) {
        return (gameState?.boardState as BoardState) || null
      }

      if (moveIndex === -1) {
        // Return initial board state
        return createInitialBoard()
      }

      // Reconstruct board state up to the specified move
      let board = createInitialBoard()

      for (let i = 0; i <= moveIndex; i++) {
        const move = moveHistory[i]
        if (move) {
          // Apply move to board
          board = applyMoveToBoard(board, move)
        }
      }

      return board
    },
    [gameState, moveHistory]
  )

  const goToMove = useCallback(
    (moveIndex: number) => {
      if (moveIndex >= -1 && moveIndex < moveHistory.length) {
        setCurrentMoveIndex(moveIndex)
      }
    },
    [moveHistory.length]
  )

  const goToPreviousMove = useCallback(() => {
    setCurrentMoveIndex(prev => Math.max(-1, prev - 1))
  }, [])

  const goToNextMove = useCallback(() => {
    setCurrentMoveIndex(prev => Math.min(moveHistory.length - 1, prev + 1))
  }, [moveHistory.length])

  const goToLatestMove = useCallback(() => {
    setCurrentMoveIndex(moveHistory.length - 1)
  }, [moveHistory.length])

  // Get current board state (either live or replay)
  const currentBoardState =
    currentMoveIndex === moveHistory.length - 1
      ? (gameState?.boardState as BoardState)
      : getBoardStateAtMove(currentMoveIndex)

  return {
    gameState,
    currentBoardState,
    isLoading,
    error,
    makeMove,
    sendChatMessage,
    latestChatMessage,
    moveHistory,
    currentMoveIndex,
    getBoardStateAtMove,
    goToMove,
    goToPreviousMove,
    goToNextMove,
    goToLatestMove,
    isValidating: validateMoveMutation.isPending,
    isMoving: makeMoveMutation.isPending,
    moveError: makeMoveMutation.error,
  }
}

// Helper functions for board state management
function createInitialBoard(): BoardState {
  const board: BoardState = Array(11)
    .fill(null)
    .map(() => Array(11).fill(null))

  // Place attackers around the edges
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

  // Place king in the center
  board[5][5] = 'king'

  return board
}

function applyMoveToBoard(board: BoardState, move: Move): BoardState {
  const newBoard = board.map(row => [...row])

  // Move the piece
  newBoard[move.to.row][move.to.col] = move.piece
  newBoard[move.from.row][move.from.col] = null

  // Apply captures if any
  if (move.captured) {
    move.captured.forEach(pos => {
      newBoard[pos.row][pos.col] = null
    })
  }

  return newBoard
}
