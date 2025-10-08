import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import TouchOptimizedGameBoard from './touch-optimized-game-board'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'
import type { Game, Move, BoardState } from '@shared/schema'

interface GameReplayProps {
  game: Game
  moveHistory: Move[]
  currentMoveIndex: number
  onMoveIndexChange: (index: number) => void
  onGoToPreviousMove: () => void
  onGoToNextMove: () => void
  onGoToLatestMove: () => void
  getBoardStateAtMove: (index: number) => BoardState | null
  className?: string
}

export default function GameReplay({
  game,
  moveHistory,
  currentMoveIndex,
  onMoveIndexChange,
  onGoToPreviousMove,
  onGoToNextMove,
  onGoToLatestMove,
  getBoardStateAtMove,
  className,
}: GameReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1000) // milliseconds per move

  // Auto-play functionality
  const startAutoPlay = useCallback(() => {
    if (currentMoveIndex >= moveHistory.length - 1) {
      onMoveIndexChange(-1) // Start from beginning
    }
    setIsPlaying(true)
  }, [currentMoveIndex, moveHistory.length, onMoveIndexChange])

  const stopAutoPlay = useCallback(() => {
    setIsPlaying(false)
  }, [])

  // Auto-advance moves when playing
  React.useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      if (currentMoveIndex < moveHistory.length - 1) {
        onGoToNextMove()
      } else {
        setIsPlaying(false) // Stop at the end
      }
    }, playbackSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, currentMoveIndex, moveHistory.length, onGoToNextMove, playbackSpeed])

  const currentBoardState = getBoardStateAtMove(currentMoveIndex)
  const currentMove = currentMoveIndex >= 0 ? moveHistory[currentMoveIndex] : null

  // Create a mock game object for the board component
  const replayGame: Game = {
    ...game,
    boardState: currentBoardState || game.boardState,
  }

  const formatMoveNotation = (move: Move, index: number): string => {
    const fromSquare = `${String.fromCharCode(97 + move.from.col)}${11 - move.from.row}`
    const toSquare = `${String.fromCharCode(97 + move.to.col)}${11 - move.to.row}`
    const pieceSymbol = move.piece === 'king' ? 'K' : move.piece === 'defender' ? 'D' : 'A'
    const captureNotation = move.captured && move.captured.length > 0 ? 'x' : '-'

    return `${index + 1}. ${pieceSymbol}${fromSquare}${captureNotation}${toSquare}`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Game Board */}
      <div className="flex justify-center">
        <TouchOptimizedGameBoard
          game={replayGame}
          onMove={() => {}} // No moves allowed in replay mode
          isPlayerTurn={false}
          userRole="defender" // Doesn't matter in replay mode
        />
      </div>

      {/* Replay Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Game Replay</span>
            <div className="text-sm text-muted-foreground">
              Move {currentMoveIndex + 1} of {moveHistory.length}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Move Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Start</span>
              <span>Current: {currentMoveIndex + 1}</span>
              <span>End</span>
            </div>
            <Slider
              value={[currentMoveIndex + 1]}
              onValueChange={([value]) => onMoveIndexChange(value - 1)}
              min={0}
              max={moveHistory.length}
              step={1}
              className="w-full"
            />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMoveIndexChange(-1)}
              disabled={currentMoveIndex === -1}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onGoToPreviousMove}
              disabled={currentMoveIndex <= -1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {isPlaying ? (
              <Button variant="outline" size="sm" onClick={stopAutoPlay}>
                <Pause className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={startAutoPlay}
                disabled={currentMoveIndex >= moveHistory.length - 1}
              >
                <Play className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onGoToNextMove}
              disabled={currentMoveIndex >= moveHistory.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onGoToLatestMove}
              disabled={currentMoveIndex >= moveHistory.length - 1}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Playback Speed Control */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Playback Speed</label>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Slow</span>
              <Slider
                value={[2000 - playbackSpeed]}
                onValueChange={([value]) => setPlaybackSpeed(2000 - value)}
                min={0}
                max={1500}
                step={100}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Fast</span>
            </div>
          </div>

          {/* Current Move Information */}
          {currentMove && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">
                {formatMoveNotation(currentMove, currentMoveIndex)}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentMove.piece?.charAt(0).toUpperCase() + currentMove.piece?.slice(1)} moved
                from {String.fromCharCode(97 + currentMove.from.col)}
                {11 - currentMove.from.row} to {String.fromCharCode(97 + currentMove.to.col)}
                {11 - currentMove.to.row}
                {currentMove.captured && currentMove.captured.length > 0 && (
                  <span>
                    {' '}
                    • Captured {currentMove.captured.length} piece
                    {currentMove.captured.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Move History List */}
      <Card>
        <CardHeader>
          <CardTitle>Move History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {moveHistory.map((move, index) => (
              <button
                key={index}
                onClick={() => onMoveIndexChange(index)}
                className={cn(
                  'w-full text-left p-2 rounded text-sm transition-colors',
                  'hover:bg-muted',
                  {
                    'bg-primary text-primary-foreground': index === currentMoveIndex,
                    'bg-muted': index < currentMoveIndex,
                  }
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono">{formatMoveNotation(move, index)}</span>
                  {move.captured && move.captured.length > 0 && (
                    <span className="text-xs opacity-70">{move.captured.length} captured</span>
                  )}
                </div>
              </button>
            ))}
            {moveHistory.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No moves yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
