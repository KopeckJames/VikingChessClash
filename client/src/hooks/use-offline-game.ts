import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { GameRole, Move } from '@shared/schema'
import { offlineGameStore, type OfflineGame, type OfflineGameHistory } from '../lib/offline-store'
import { AI_PERSONALITIES } from '@shared/ai-engine'
import { useOnlineStatus } from './use-connection-status'

export function useOfflineGame(gameId?: string) {
  const [currentGame, setCurrentGame] = useState<OfflineGame | null>(null)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  // Load game data
  const {
    data: game,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['offlineGame', gameId],
    queryFn: () => (gameId ? offlineGameStore.getGame(gameId) : null),
    enabled: !!gameId,
    staleTime: 0, // Always fetch fresh data
  })

  useEffect(() => {
    if (game) {
      setCurrentGame(game)
    }
  }, [game])

  // Create new offline game
  const createGameMutation = useMutation({
    mutationFn: async (params: {
      playerRole: GameRole
      aiDifficulty?: number
      aiPersonality?: keyof typeof AI_PERSONALITIES
    }) => {
      const { playerRole, aiDifficulty = 5, aiPersonality = 'balanced' } = params
      return await offlineGameStore.createOfflineGame(playerRole, aiDifficulty, aiPersonality)
    },
    onSuccess: newGame => {
      setCurrentGame(newGame)
      queryClient.invalidateQueries({ queryKey: ['offlineGames'] })
    },
  })

  // Make player move
  const makeMoveMutation = useMutation({
    mutationFn: async (move: Move) => {
      if (!currentGame) throw new Error('No active game')
      return await offlineGameStore.makeMove(currentGame.id, move)
    },
    onSuccess: async updatedGame => {
      setCurrentGame(updatedGame)
      queryClient.invalidateQueries({ queryKey: ['offlineGame', gameId] })

      // If game is still active and it's AI's turn, make AI move
      if (updatedGame.status === 'active' && updatedGame.currentPlayer === updatedGame.aiRole) {
        setIsAIThinking(true)
        try {
          // Add a small delay to make AI thinking visible
          await new Promise(resolve => setTimeout(resolve, 500))
          const gameWithAIMove = await offlineGameStore.makeAIMove(updatedGame.id)
          setCurrentGame(gameWithAIMove)
          queryClient.invalidateQueries({ queryKey: ['offlineGame', gameId] })
        } catch (error) {
          console.error('AI move failed:', error)
        } finally {
          setIsAIThinking(false)
        }
      }
    },
  })

  // Delete game
  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      await offlineGameStore.deleteGame(gameId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineGames'] })
      if (currentGame?.id === gameId) {
        setCurrentGame(null)
      }
    },
  })

  const createGame = useCallback(
    (
      playerRole: GameRole,
      aiDifficulty?: number,
      aiPersonality?: keyof typeof AI_PERSONALITIES
    ) => {
      return createGameMutation.mutateAsync({ playerRole, aiDifficulty, aiPersonality })
    },
    [createGameMutation]
  )

  const makeMove = useCallback(
    (move: Move) => {
      return makeMoveMutation.mutateAsync(move)
    },
    [makeMoveMutation]
  )

  const deleteGame = useCallback(
    (gameId: string) => {
      return deleteGameMutation.mutateAsync(gameId)
    },
    [deleteGameMutation]
  )

  return {
    game: currentGame,
    isLoading,
    error,
    isAIThinking,
    isOnline,
    createGame,
    makeMove,
    deleteGame,
    isCreating: createGameMutation.isPending,
    isMoving: makeMoveMutation.isPending,
    isDeleting: deleteGameMutation.isPending,
  }
}

export function useOfflineGames() {
  const queryClient = useQueryClient()

  // Get all offline games
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['offlineGames'],
    queryFn: () => offlineGameStore.getAllGames(),
    staleTime: 30000, // Cache for 30 seconds
  })

  // Get active games only
  const { data: activeGames = [] } = useQuery({
    queryKey: ['offlineGames', 'active'],
    queryFn: () => offlineGameStore.getActiveGames(),
    staleTime: 30000,
  })

  // Get game history and statistics
  const { data: gameHistory } = useQuery({
    queryKey: ['offlineGameHistory'],
    queryFn: () => offlineGameStore.getGameHistory(),
    staleTime: 60000, // Cache for 1 minute
  })

  // Clear all offline data
  const clearDataMutation = useMutation({
    mutationFn: () => offlineGameStore.clearAllData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineGames'] })
      queryClient.invalidateQueries({ queryKey: ['offlineGameHistory'] })
    },
  })

  // Export game data
  const exportDataMutation = useMutation({
    mutationFn: () => offlineGameStore.exportGameData(),
    onSuccess: data => {
      // Create and download file
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `viking-chess-offline-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  })

  // Import game data
  const importDataMutation = useMutation({
    mutationFn: (jsonData: string) => offlineGameStore.importGameData(jsonData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineGames'] })
      queryClient.invalidateQueries({ queryKey: ['offlineGameHistory'] })
    },
  })

  const clearAllData = useCallback(() => {
    return clearDataMutation.mutateAsync()
  }, [clearDataMutation])

  const exportData = useCallback(() => {
    return exportDataMutation.mutateAsync()
  }, [exportDataMutation])

  const importData = useCallback(
    (jsonData: string) => {
      return importDataMutation.mutateAsync(jsonData)
    },
    [importDataMutation]
  )

  return {
    games,
    activeGames,
    gameHistory,
    isLoading,
    clearAllData,
    exportData,
    importData,
    isClearing: clearDataMutation.isPending,
    isExporting: exportDataMutation.isPending,
    isImporting: importDataMutation.isPending,
  }
}
