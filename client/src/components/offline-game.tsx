import React, { useState } from 'react'
import { Bot, User, Crown, Sword, Shield, Clock, Trophy, RotateCcw } from 'lucide-react'
import type { GameRole, Move, Position } from '@shared/schema'
import { useOfflineGame } from '../hooks/use-offline-game'
import { AI_PERSONALITIES } from '@shared/ai-engine'
import { TouchOptimizedGameBoard } from './touch-optimized-game-board'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { ConnectionStatusCompact } from './connection-status'

interface OfflineGameProps {
  gameId?: string
  onGameEnd?: (winner: GameRole | null) => void
}

export function OfflineGame({ gameId, onGameEnd }: OfflineGameProps) {
  const {
    game,
    isLoading,
    error,
    isAIThinking,
    createGame,
    makeMove,
    deleteGame,
    isCreating,
    isMoving,
  } = useOfflineGame(gameId)

  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])

  // Game creation state
  const [playerRole, setPlayerRole] = useState<GameRole>('defender')
  const [aiDifficulty, setAiDifficulty] = useState(5)
  const [aiPersonality, setAiPersonality] = useState<keyof typeof AI_PERSONALITIES>('balanced')

  const handleCreateGame = async () => {
    try {
      await createGame(playerRole, aiDifficulty, aiPersonality)
    } catch (error) {
      console.error('Failed to create offline game:', error)
    }
  }

  const handlePieceSelect = (position: Position) => {
    if (!game || game.status !== 'active' || game.currentPlayer !== game.playerRole) {
      return
    }

    const piece = game.boardState[position.row][position.col]
    if (!piece) return

    // Check if this piece belongs to the current player
    const isPlayerPiece =
      (game.playerRole === 'attacker' && piece === 'attacker') ||
      (game.playerRole === 'defender' && (piece === 'defender' || piece === 'king'))

    if (!isPlayerPiece) return

    setSelectedPiece(position)
    // Calculate valid moves for this piece
    // This would need to be implemented based on game logic
    setValidMoves([])
  }

  const handleMove = async (to: Position) => {
    if (!game || !selectedPiece) return

    const piece = game.boardState[selectedPiece.row][selectedPiece.col]
    if (!piece) return

    const move: Move = {
      from: selectedPiece,
      to,
      piece,
      timestamp: Date.now(),
    }

    try {
      await makeMove(move)
      setSelectedPiece(null)
      setValidMoves([])
    } catch (error) {
      console.error('Failed to make move:', error)
    }
  }

  const handleDeleteGame = async () => {
    if (!game) return

    if (confirm('Are you sure you want to delete this game?')) {
      try {
        await deleteGame(game.id)
        onGameEnd?.(null)
      } catch (error) {
        console.error('Failed to delete game:', error)
      }
    }
  }

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return 'Beginner'
    if (difficulty <= 4) return 'Easy'
    if (difficulty <= 6) return 'Medium'
    if (difficulty <= 8) return 'Hard'
    return 'Expert'
  }

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'aggressive':
        return <Sword className="h-4 w-4" />
      case 'defensive':
        return <Shield className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading offline game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <p>Error loading offline game</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Create Offline Game
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span>Connection Status:</span>
            <ConnectionStatusCompact />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label htmlFor="player-role">Your Role</Label>
              <Select value={playerRole} onValueChange={(value: GameRole) => setPlayerRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attacker">
                    <div className="flex items-center gap-2">
                      <Sword className="h-4 w-4" />
                      Attacker (Surround the King)
                    </div>
                  </SelectItem>
                  <SelectItem value="defender">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Defender (Escape with King)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ai-difficulty">
                AI Difficulty: {getDifficultyLabel(aiDifficulty)} ({aiDifficulty}/10)
              </Label>
              <Slider
                value={[aiDifficulty]}
                onValueChange={value => setAiDifficulty(value[0])}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="ai-personality">AI Personality</Label>
              <Select
                value={aiPersonality}
                onValueChange={(value: keyof typeof AI_PERSONALITIES) => setAiPersonality(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_PERSONALITIES).map(([key, personality]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {getPersonalityIcon(key)}
                        <span className="capitalize">{personality.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCreateGame} disabled={isCreating} className="w-full">
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Game...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Start Offline Game
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Game Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">You</span>
                <Badge variant={game.playerRole === 'attacker' ? 'destructive' : 'default'}>
                  {game.playerRole === 'attacker' ? (
                    <>
                      <Sword className="h-3 w-3 mr-1" />
                      Attacker
                    </>
                  ) : (
                    <>
                      <Crown className="h-3 w-3 mr-1" />
                      Defender
                    </>
                  )}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground">vs</div>

              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="font-medium">AI</span>
                <Badge variant={game.aiRole === 'attacker' ? 'destructive' : 'default'}>
                  {getPersonalityIcon(game.aiPersonality)}
                  <span className="ml-1 capitalize">{game.aiPersonality}</span>
                </Badge>
                <Badge variant="outline">{getDifficultyLabel(game.aiDifficulty)}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ConnectionStatusCompact />
              <Button variant="outline" size="sm" onClick={handleDeleteGame}>
                Delete Game
              </Button>
            </div>
          </div>

          {/* Current Turn Indicator */}
          <div className="mt-4 flex items-center justify-center">
            {game.status === 'active' ? (
              <div className="flex items-center gap-2">
                {isAIThinking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>AI is thinking...</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>
                      {game.currentPlayer === game.playerRole ? 'Your turn' : "AI's turn"}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>
                  Game Over -{' '}
                  {game.winner === game.playerRole
                    ? 'You Win!'
                    : game.winner
                      ? 'AI Wins!'
                      : 'Draw!'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Game Board */}
      <TouchOptimizedGameBoard
        board={game.boardState}
        onPieceSelect={handlePieceSelect}
        onMove={handleMove}
        selectedPiece={selectedPiece}
        validMoves={validMoves}
        currentPlayer={game.currentPlayer}
        disabled={
          game.status !== 'active' ||
          game.currentPlayer !== game.playerRole ||
          isMoving ||
          isAIThinking
        }
      />

      {/* Move History */}
      {game.moveHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Move History ({game.moveHistory.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="max-h-32 overflow-y-auto text-sm space-y-1">
              {game.moveHistory.slice(-10).map((move, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {game.moveHistory.length - 10 + index + 1}.
                  </span>
                  <span>
                    {move.piece} from ({move.from.row}, {move.from.col}) to ({move.to.row},{' '}
                    {move.to.col})
                  </span>
                  {move.captured && move.captured.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{move.captured.length} captured
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
