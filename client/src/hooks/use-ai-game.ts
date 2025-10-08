import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AIOpponent, GameRole, Game } from '../../../shared/schema'

interface CreateAIGameRequest {
  aiOpponentId: number
  userRole: GameRole
  timeControl: string
}

interface CreateAIGameResponse {
  game: Game
  aiOpponent: AIOpponent
}

interface AIGameHook {
  opponents: AIOpponent[]
  isLoadingOpponents: boolean
  createAIGame: (request: CreateAIGameRequest) => Promise<CreateAIGameResponse>
  isCreatingGame: boolean
  error: string | null
}

export function useAIGame(): AIGameHook {
  const [error, setError] = useState<string | null>(null)

  // Fetch AI opponents
  const { data: opponents = [], isLoading: isLoadingOpponents } = useQuery({
    queryKey: ['ai-opponents'],
    queryFn: async (): Promise<AIOpponent[]> => {
      const response = await fetch('/api/ai/opponents')
      if (!response.ok) {
        throw new Error('Failed to fetch AI opponents')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Create AI game mutation
  const createGameMutation = useMutation({
    mutationFn: async (request: CreateAIGameRequest): Promise<CreateAIGameResponse> => {
      const response = await fetch('/api/ai/opponents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create AI game')
      }

      return response.json()
    },
    onError: (error: Error) => {
      setError(error.message)
    },
    onSuccess: () => {
      setError(null)
    },
  })

  const createAIGame = useCallback(
    async (request: CreateAIGameRequest): Promise<CreateAIGameResponse> => {
      setError(null)
      return createGameMutation.mutateAsync(request)
    },
    [createGameMutation]
  )

  return {
    opponents,
    isLoadingOpponents,
    createAIGame,
    isCreatingGame: createGameMutation.isPending,
    error,
  }
}

// Hook for requesting AI moves
export function useAIMove() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestAIMove = useCallback(async (gameId: number) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI move')
      }

      const data = await response.json()
      return data.move
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return {
    requestAIMove,
    isGenerating,
    error,
  }
}
