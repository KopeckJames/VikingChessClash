/**
 * Accessibility-enhanced game board component
 * Provides keyboard navigation, screen reader support, and voice control
 */

import * as React from 'react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { TouchButton } from '@/components/ui/touch-button'
import {
  useGestureNavigation,
  useKeyboardNavigation,
  useFocusManagement,
} from '@/hooks/use-gesture-navigation'
import { useVoiceControl, createGameVoiceCommands } from '@/hooks/use-voice-control'
import {
  announceToScreenReader,
  describeBoardPosition,
  describeGamePiece,
  describeGameMove,
} from '@/lib/accessibility'
import { cn } from '@/lib/utils'

interface GamePiece {
  type: 'king' | 'defender' | 'attacker'
  player: 'attacker' | 'defender'
  position: { row: number; col: number }
}

interface AccessibleGameBoardProps {
  boardSize?: number
  pieces: GamePiece[]
  selectedPosition?: { row: number; col: number } | null
  validMoves?: { row: number; col: number }[]
  onPieceSelect?: (position: { row: number; col: number }) => void
  onMove?: (from: { row: number; col: number }, to: { row: number; col: number }) => void
  currentPlayer?: 'attacker' | 'defender'
  gameStatus?: 'waiting' | 'active' | 'completed'
  className?: string
}

export function AccessibleGameBoard({
  boardSize = 11,
  pieces,
  selectedPosition,
  validMoves = [],
  onPieceSelect,
  onMove,
  currentPlayer = 'attacker',
  gameStatus = 'active',
  className,
}: AccessibleGameBoardProps) {
  const [focusedPosition, setFocusedPosition] = useState<{ row: number; col: number }>({
    row: 5,
    col: 5,
  })
  const [announcementMode, setAnnouncementMode] = useState<'minimal' | 'detailed'>('minimal')
  const boardRef = useRef<HTMLDivElement>(null)
  const { saveFocus, restoreFocus, focusFirst } = useFocusManagement()

  // Create board grid
  const boardGrid = React.useMemo(() => {
    const grid: (GamePiece | null)[][] = Array(boardSize)
      .fill(null)
      .map(() => Array(boardSize).fill(null))
    pieces.forEach(piece => {
      grid[piece.position.row][piece.position.col] = piece
    })
    return grid
  }, [pieces, boardSize])

  // Voice control commands
  const voiceCommands = createGameVoiceCommands({
    selectPiece: (position: string) => {
      // Parse position like "A1", "B5", etc.
      const col = position.charCodeAt(0) - 65 // A=0, B=1, etc.
      const row = boardSize - parseInt(position.slice(1)) // Convert to 0-based from bottom

      if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
        handleCellSelect({ row, col })
      }
    },
    showMoves: () => {
      if (selectedPosition) {
        announceValidMoves()
      } else {
        announceToScreenReader('No piece selected. Select a piece first to see available moves.')
      }
    },
    showHelp: () => {
      announceGameHelp()
    },
  })

  const { isListening } = useVoiceControl(voiceCommands, {
    enabled: true, // Will be controlled by accessibility settings
  })

  // Keyboard navigation
  useKeyboardNavigation({
    onArrowKey: direction => {
      const newPos = { ...focusedPosition }

      switch (direction) {
        case 'up':
          newPos.row = Math.max(0, newPos.row - 1)
          break
        case 'down':
          newPos.row = Math.min(boardSize - 1, newPos.row + 1)
          break
        case 'left':
          newPos.col = Math.max(0, newPos.col - 1)
          break
        case 'right':
          newPos.col = Math.min(boardSize - 1, newPos.col + 1)
          break
      }

      setFocusedPosition(newPos)
      announceFocusedCell(newPos)
    },
    onEnter: () => {
      handleCellSelect(focusedPosition)
    },
    onSpace: () => {
      handleCellSelect(focusedPosition)
    },
    onEscape: () => {
      if (selectedPosition) {
        onPieceSelect?.(selectedPosition) // Deselect
        announceToScreenReader('Selection cleared')
      }
    },
  })

  // Gesture navigation
  useGestureNavigation(boardRef, {
    onSwipeLeft: () => {
      const newPos = { ...focusedPosition, col: Math.max(0, focusedPosition.col - 1) }
      setFocusedPosition(newPos)
      announceFocusedCell(newPos)
    },
    onSwipeRight: () => {
      const newPos = { ...focusedPosition, col: Math.min(boardSize - 1, focusedPosition.col + 1) }
      setFocusedPosition(newPos)
      announceFocusedCell(newPos)
    },
    onSwipeUp: () => {
      const newPos = { ...focusedPosition, row: Math.max(0, focusedPosition.row - 1) }
      setFocusedPosition(newPos)
      announceFocusedCell(newPos)
    },
    onSwipeDown: () => {
      const newPos = { ...focusedPosition, row: Math.min(boardSize - 1, focusedPosition.row + 1) }
      setFocusedPosition(newPos)
      announceFocusedCell(newPos)
    },
    onDoubleTap: () => {
      handleCellSelect(focusedPosition)
    },
    onLongPress: () => {
      announceDetailedCellInfo(focusedPosition)
    },
  })

  // Cell selection handler
  const handleCellSelect = useCallback(
    (position: { row: number; col: number }) => {
      const piece = boardGrid[position.row][position.col]

      if (selectedPosition) {
        // Try to move
        if (validMoves.some(move => move.row === position.row && move.col === position.col)) {
          onMove?.(selectedPosition, position)
          const moveDescription = describeGameMove(
            describeBoardPosition(selectedPosition.row, selectedPosition.col, boardSize),
            describeBoardPosition(position.row, position.col, boardSize),
            boardGrid[selectedPosition.row][selectedPosition.col]?.type || 'piece'
          )
          announceToScreenReader(moveDescription)
        } else {
          // Invalid move or deselect
          onPieceSelect?.(position)
          if (piece) {
            announceToScreenReader(
              `Selected ${describeGamePiece(piece.type, describeBoardPosition(position.row, position.col, boardSize))}`
            )
          } else {
            announceToScreenReader('Selection cleared')
          }
        }
      } else {
        // Select piece
        if (piece && piece.player === currentPlayer) {
          onPieceSelect?.(position)
          announceToScreenReader(
            `Selected ${describeGamePiece(piece.type, describeBoardPosition(position.row, position.col, boardSize))}`
          )
        } else if (piece) {
          announceToScreenReader(`Cannot select opponent's ${piece.type}`)
        } else {
          announceToScreenReader('Empty square')
        }
      }
    },
    [selectedPosition, validMoves, boardGrid, currentPlayer, onMove, onPieceSelect, boardSize]
  )

  // Announce focused cell
  const announceFocusedCell = useCallback(
    (position: { row: number; col: number }) => {
      if (announcementMode === 'minimal') return

      const piece = boardGrid[position.row][position.col]
      const positionName = describeBoardPosition(position.row, position.col, boardSize)

      if (piece) {
        announceToScreenReader(`${positionName}: ${describeGamePiece(piece.type)}`)
      } else {
        announceToScreenReader(`${positionName}: Empty`)
      }
    },
    [boardGrid, boardSize, announcementMode]
  )

  // Announce detailed cell information
  const announceDetailedCellInfo = useCallback(
    (position: { row: number; col: number }) => {
      const piece = boardGrid[position.row][position.col]
      const positionName = describeBoardPosition(position.row, position.col, boardSize)

      let announcement = `Position ${positionName}. `

      if (piece) {
        announcement += `Contains ${piece.player} ${piece.type}. `
        if (piece.player === currentPlayer) {
          announcement += 'Can be selected. '
        } else {
          announcement += 'Opponent piece. '
        }
      } else {
        announcement += 'Empty square. '
        if (
          selectedPosition &&
          validMoves.some(move => move.row === position.row && move.col === position.col)
        ) {
          announcement += 'Valid move destination. '
        }
      }

      announceToScreenReader(announcement)
    },
    [boardGrid, boardSize, currentPlayer, selectedPosition, validMoves]
  )

  // Announce valid moves
  const announceValidMoves = useCallback(() => {
    if (!selectedPosition || validMoves.length === 0) {
      announceToScreenReader('No valid moves available')
      return
    }

    const moveList = validMoves
      .map(move => describeBoardPosition(move.row, move.col, boardSize))
      .join(', ')

    announceToScreenReader(`Valid moves: ${moveList}`)
  }, [selectedPosition, validMoves, boardSize])

  // Announce game help
  const announceGameHelp = useCallback(() => {
    const help = [
      'Use arrow keys or swipe to navigate the board.',
      'Press Enter or Space to select a piece or make a move.',
      'Press Escape to clear selection.',
      'Double tap or long press for detailed information.',
      'Say "show moves" to hear valid moves for selected piece.',
    ].join(' ')

    announceToScreenReader(help)
  }, [])

  // Focus management on mount
  useEffect(() => {
    if (boardRef.current) {
      focusFirst(boardRef.current)
    }
  }, [focusFirst])

  // Render cell
  const renderCell = (row: number, col: number) => {
    const piece = boardGrid[row][col]
    const position = { row, col }
    const isSelected = selectedPosition?.row === row && selectedPosition?.col === col
    const isFocused = focusedPosition.row === row && focusedPosition.col === col
    const isValidMove = validMoves.some(move => move.row === row && move.col === col)
    const positionName = describeBoardPosition(row, col, boardSize)

    // Determine cell type for styling
    const isCorner = (row === 0 || row === boardSize - 1) && (col === 0 || col === boardSize - 1)
    const isThrone = row === Math.floor(boardSize / 2) && col === Math.floor(boardSize / 2)
    const isEscape =
      !isThrone && (row === 0 || row === boardSize - 1 || col === 0 || col === boardSize - 1)

    return (
      <TouchButton
        key={`${row}-${col}`}
        variant="ghost"
        className={cn(
          'relative aspect-square border border-border/50 p-0 rounded-none',
          'focus:ring-2 focus:ring-primary focus:ring-offset-0',
          'transition-all duration-200',
          // Cell type styling
          isThrone && 'bg-yellow-100 dark:bg-yellow-900/30',
          isCorner && 'bg-red-100 dark:bg-red-900/30',
          isEscape && 'bg-blue-100 dark:bg-blue-900/30',
          // State styling
          isSelected && 'ring-2 ring-primary bg-primary/20',
          isFocused && 'ring-2 ring-secondary bg-secondary/20',
          isValidMove && 'bg-green-100 dark:bg-green-900/30 ring-1 ring-green-500',
          // High contrast support
          'high-contrast:border-2 high-contrast:border-current'
        )}
        onClick={() => handleCellSelect(position)}
        onFocus={() => setFocusedPosition(position)}
        aria-label={`${positionName}${piece ? `, ${describeGamePiece(piece.type)}` : ', empty'}${isValidMove ? ', valid move' : ''}`}
        aria-pressed={isSelected}
        aria-describedby={isFocused ? `cell-${row}-${col}-description` : undefined}
        hapticFeedback={true}
        announceOnClick={
          piece
            ? `Selected ${piece.type} at ${positionName}`
            : `Selected empty square ${positionName}`
        }
      >
        {/* Piece rendering */}
        {piece && (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
              piece.type === 'king' && 'bg-yellow-500 text-yellow-900',
              piece.type === 'defender' && 'bg-blue-500 text-blue-900',
              piece.type === 'attacker' && 'bg-red-500 text-red-900',
              // High contrast support
              'high-contrast:border-2 high-contrast:border-current'
            )}
          >
            {piece.type === 'king' ? '♔' : piece.type === 'defender' ? '♗' : '♟'}
          </div>
        )}

        {/* Valid move indicator */}
        {isValidMove && !piece && <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />}

        {/* Screen reader description */}
        {isFocused && (
          <div id={`cell-${row}-${col}-description`} className="sr-only">
            {isThrone && 'Throne square. '}
            {isCorner && 'Corner escape square. '}
            {isEscape && !isCorner && 'Edge escape square. '}
            {isValidMove && 'Valid move destination. '}
          </div>
        )}
      </TouchButton>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Game status and controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Viking Chess Board</h2>
          <p className="text-sm text-muted-foreground">
            Current player: {currentPlayer} | Status: {gameStatus}
            {isListening && ' | Voice control active'}
          </p>
        </div>

        <div className="flex gap-2">
          <TouchButton
            variant="outline"
            size="sm"
            onClick={() =>
              setAnnouncementMode(mode => (mode === 'minimal' ? 'detailed' : 'minimal'))
            }
            aria-label={`Toggle announcement mode. Currently ${announcementMode}`}
          >
            {announcementMode === 'minimal' ? '🔇' : '🔊'}
          </TouchButton>

          <TouchButton
            variant="outline"
            size="sm"
            onClick={announceGameHelp}
            aria-label="Get help with game controls"
          >
            ❓
          </TouchButton>

          <TouchButton
            variant="outline"
            size="sm"
            onClick={announceValidMoves}
            aria-label="Announce valid moves for selected piece"
            disabled={!selectedPosition}
          >
            📍
          </TouchButton>
        </div>
      </div>

      {/* Game board */}
      <div
        ref={boardRef}
        className={cn(
          'grid gap-0 border-2 border-border rounded-lg overflow-hidden',
          'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2'
        )}
        style={{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }}
        role="grid"
        aria-label="Viking Chess game board"
        aria-rowcount={boardSize}
        aria-colcount={boardSize}
      >
        {Array.from({ length: boardSize }, (_, row) =>
          Array.from({ length: boardSize }, (_, col) => renderCell(row, col))
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Keyboard:</strong> Arrow keys to navigate, Enter/Space to select, Escape to clear
        </p>
        <p>
          <strong>Touch:</strong> Tap to select, double-tap for info, long press for details
        </p>
        <p>
          <strong>Voice:</strong> Say "select A1", "show moves", or "help" for commands
        </p>
      </div>
    </div>
  )
}
