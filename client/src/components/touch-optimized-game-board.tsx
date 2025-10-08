import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import InteractiveGamePiece from './interactive-game-piece'
import { isValidMove } from '@/lib/game-logic'
import type { Game, BoardState, PieceType, Position, Move } from '@shared/schema'

interface TouchOptimizedGameBoardProps {
  game: Game
  onMove: (move: Move) => void
  isPlayerTurn: boolean
  userRole: 'attacker' | 'defender'
}

export default function TouchOptimizedGameBoard({
  game,
  onMove,
  isPlayerTurn,
  userRole,
}: TouchOptimizedGameBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Position | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    lastTouchTime: 0,
  })

  const board = game.boardState as BoardState

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50],
      }
      navigator.vibrate(patterns[type])
    }
  }, [])

  // Handle pinch-to-zoom
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        gestureRef.current.initialDistance = distance
        gestureRef.current.initialScale = scale
      }
    },
    [scale]
  )

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      const scaleChange = distance / gestureRef.current.initialDistance
      const newScale = Math.max(0.5, Math.min(2, gestureRef.current.initialScale * scaleChange))
      setScale(newScale)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    gestureRef.current.initialDistance = 0
  }, [])

  // Handle square interactions
  const handleSquareTouch = useCallback(
    (row: number, col: number, e: React.TouchEvent) => {
      e.preventDefault()
      const currentTime = Date.now()
      const timeSinceLastTouch = currentTime - gestureRef.current.lastTouchTime
      gestureRef.current.lastTouchTime = currentTime

      // Prevent accidental touches during zoom
      if (timeSinceLastTouch < 100) return

      const clickedPiece = board[row][col]
      const clickedPosition = { row, col }

      // Trigger haptic feedback for valid interactions
      if (clickedPiece || validMoves.some(move => move.row === row && move.col === col)) {
        triggerHapticFeedback('light')
      }

      // If there's a selected piece and this is a valid move
      if (selectedSquare && validMoves.some(move => move.row === row && move.col === col)) {
        const piece = board[selectedSquare.row][selectedSquare.col]
        const move: Move = {
          from: selectedSquare,
          to: clickedPosition,
          piece,
          timestamp: Date.now(),
        }

        triggerHapticFeedback('medium')
        onMove(move)
        setSelectedSquare(null)
        setValidMoves([])
        return
      }

      // If clicking on a piece that belongs to the current player
      if (clickedPiece && isPlayerTurn && game.status === 'active') {
        const canSelectPiece =
          (userRole === 'defender' && (clickedPiece === 'king' || clickedPiece === 'defender')) ||
          (userRole === 'attacker' && clickedPiece === 'attacker')

        if (canSelectPiece) {
          setSelectedSquare(clickedPosition)
          const moves = calculateValidMoves(board, clickedPosition, clickedPiece)
          setValidMoves(moves)
          triggerHapticFeedback('light')
        } else {
          setSelectedSquare(null)
          setValidMoves([])
        }
      } else {
        setSelectedSquare(null)
        setValidMoves([])
      }
    },
    [
      board,
      selectedSquare,
      validMoves,
      isPlayerTurn,
      userRole,
      game.status,
      onMove,
      triggerHapticFeedback,
    ]
  )

  const calculateValidMoves = (board: BoardState, from: Position, piece: PieceType): Position[] => {
    const moves: Position[] = []

    if (!piece) return moves

    const directions = [
      [-1, 0],
      [1, 0], // vertical
      [0, -1],
      [0, 1], // horizontal
    ]

    for (const [dr, dc] of directions) {
      for (let distance = 1; distance < 11; distance++) {
        const newRow = from.row + dr * distance
        const newCol = from.col + dc * distance

        if (newRow < 0 || newRow >= 11 || newCol < 0 || newCol >= 11) break

        const targetSquare = { row: newRow, col: newCol }

        if (isValidMove(board, from, targetSquare, piece)) {
          moves.push(targetSquare)
        } else {
          break
        }
      }
    }

    return moves
  }

  const isSquareSelected = (row: number, col: number) => {
    return selectedSquare?.row === row && selectedSquare?.col === col
  }

  const isValidMoveSquare = (row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col)
  }

  const getSquareClass = (row: number, col: number) => {
    const isThrone = row === 5 && col === 5
    const isCorner =
      (row === 0 && col === 0) ||
      (row === 0 && col === 10) ||
      (row === 10 && col === 0) ||
      (row === 10 && col === 10)

    return cn(
      'board-cell',
      'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14',
      'border border-amber-300 rounded-sm',
      'flex items-center justify-center',
      'transition-all duration-200',
      'touch-manipulation', // Optimize for touch
      {
        'bg-amber-100': !isThrone && !isCorner,
        throne: isThrone,
        corner: isCorner,
        selected: isSquareSelected(row, col),
        'valid-move': isValidMoveSquare(row, col),
        'bg-yellow-200 ring-2 ring-yellow-400 ring-opacity-70': isSquareSelected(row, col),
        'bg-green-200 ring-2 ring-green-400 ring-opacity-70': isValidMoveSquare(row, col),
        'bg-gradient-to-br from-yellow-200 to-yellow-300 border-2 border-yellow-500': isThrone,
        'bg-gradient-to-br from-red-200 to-red-300 border-2 border-red-500': isCorner,
      }
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div
        ref={boardRef}
        className="bg-gradient-to-br from-amber-100 to-amber-200 p-4 rounded-2xl shadow-inner"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          transition: 'transform 0.1s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-11 gap-1 max-w-sm sm:max-w-md md:max-w-lg mx-auto">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getSquareClass(rowIndex, colIndex)}
                onTouchStart={e => handleSquareTouch(rowIndex, colIndex, e)}
                style={{ minHeight: '44px', minWidth: '44px' }} // Ensure minimum touch target
              >
                {piece && (
                  <InteractiveGamePiece
                    type={piece}
                    position={{ row: rowIndex, col: colIndex }}
                    isSelected={isSquareSelected(rowIndex, colIndex)}
                    canMove={isPlayerTurn && game.status === 'active'}
                    onDragStart={setDragStart}
                    onDragEnd={(from, to) => {
                      if (from && to && isValidMove(board, from, to, piece)) {
                        const move: Move = {
                          from,
                          to,
                          piece,
                          timestamp: Date.now(),
                        }
                        triggerHapticFeedback('medium')
                        onMove(move)
                      }
                      setDragStart(null)
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
                  />
                )}
                {/* Visual move indicators */}
                {isValidMoveSquare(rowIndex, colIndex) && !piece && (
                  <div className="relative">
                    <div className="w-4 h-4 bg-green-400 rounded-full opacity-80 animate-pulse" />
                    <div className="absolute inset-0 w-4 h-4 bg-green-300 rounded-full animate-ping" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Enhanced Legend with better mobile visibility */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-400 rounded-full"></div>
            <span className="text-gray-700 font-medium">Valid Move</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full ring-2 ring-yellow-400"></div>
            <span className="text-gray-700 font-medium">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-300 border-2 border-yellow-500 rounded-sm"></div>
            <span className="text-gray-700 font-medium">Throne</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-300 border-2 border-red-500 rounded-sm"></div>
            <span className="text-gray-700 font-medium">Corner</span>
          </div>
        </div>

        {/* Zoom controls for accessibility */}
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            Zoom Out
          </button>
          <button
            onClick={() => setScale(1)}
            className="px-3 py-2 bg-blue-200 rounded-lg text-sm font-medium hover:bg-blue-300 transition-colors"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            Reset
          </button>
          <button
            onClick={() => setScale(Math.min(2, scale + 0.1))}
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            Zoom In
          </button>
        </div>
      </div>
    </div>
  )
}
