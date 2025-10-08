'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type PieceType = 'king' | 'defender' | 'attacker' | null
type BoardState = PieceType[][]
type Position = { row: number; col: number }

interface Move {
  from: Position
  to: Position
  piece: PieceType
}

export default function GamePage() {
  const searchParams = useSearchParams()
  const gameMode = searchParams.get('mode') || 'local'
  const aiLevel = searchParams.get('level') || 'medium'
  const playerRole = searchParams.get('role') || 'attacker'

  const [board, setBoard] = useState<BoardState>(() => createInitialBoard())
  const [currentPlayer, setCurrentPlayer] = useState<'attacker' | 'defender'>('attacker')
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [gameStatus, setGameStatus] = useState<'playing' | 'attacker_wins' | 'defender_wins'>(
    'playing'
  )
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [capturePreview, setCapturePreview] = useState<Position[]>([])
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [aiOpponent, setAiOpponent] = useState<string>('')

  function createInitialBoard(): BoardState {
    const board: BoardState = Array(11)
      .fill(null)
      .map(() => Array(11).fill(null))

    // Standard 11x11 Hnefatafl setup - Copenhagen rules
    // Place attackers on the edges
    const attackerPositions = [
      // Top row
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
      [0, 7],
      // Second row (only center)
      [1, 5],
      // Left column
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 0],
      [7, 0],
      // Second column (only center)
      [5, 1],
      // Right column
      [3, 10],
      [4, 10],
      [5, 10],
      [6, 10],
      [7, 10],
      // Second-to-last column (only center)
      [5, 9],
      // Bottom row
      [10, 3],
      [10, 4],
      [10, 5],
      [10, 6],
      [10, 7],
      // Second-to-last row (only center)
      [9, 5],
    ]

    attackerPositions.forEach(([row, col]) => {
      board[row][col] = 'attacker'
    })

    // Place defenders in cross formation around the king
    const defenderPositions = [
      // Vertical line above king
      [2, 5],
      [3, 5],
      [4, 5],
      // Horizontal line left of king
      [5, 2],
      [5, 3],
      [5, 4],
      // Horizontal line right of king
      [5, 6],
      [5, 7],
      [5, 8],
      // Vertical line below king
      [6, 5],
      [7, 5],
      [8, 5],
      // Additional defenders for balance
      [3, 4],
      [3, 6],
      [4, 3],
      [4, 4],
      [4, 6],
      [4, 7],
      [6, 3],
      [6, 4],
      [6, 6],
      [6, 7],
      [7, 4],
      [7, 6],
    ]

    defenderPositions.forEach(([row, col]) => {
      board[row][col] = 'defender'
    })

    // Place king on throne (center)
    board[5][5] = 'king'

    return board
  }

  function isValidMove(from: Position, to: Position, piece: PieceType): boolean {
    if (!piece) return false

    // Can't move to same square
    if (from.row === to.row && from.col === to.col) return false

    // Can't move to occupied square
    if (board[to.row][to.col] !== null) return false

    // Must move in straight line (rook-like movement)
    if (from.row !== to.row && from.col !== to.col) return false

    // Restricted squares rules
    const isThrone = to.row === 5 && to.col === 5
    const isCornerSquare = isCorner(to.row, to.col)

    if (piece !== 'king') {
      // Only king can move to throne or corners
      if (isThrone || isCornerSquare) {
        return false
      }

      // Regular pieces cannot pass through throne (but king can)
      if (from.row === 5 && from.col === 5) {
        return false // This shouldn't happen as only king should be on throne
      }
    }

    // Check if path is clear
    const rowDir = to.row > from.row ? 1 : to.row < from.row ? -1 : 0
    const colDir = to.col > from.col ? 1 : to.col < from.col ? -1 : 0

    let currentRow = from.row + rowDir
    let currentCol = from.col + colDir

    while (currentRow !== to.row || currentCol !== to.col) {
      // Path is blocked by another piece
      if (board[currentRow][currentCol] !== null) return false

      // Regular pieces cannot pass through throne (even if empty)
      if (piece !== 'king' && currentRow === 5 && currentCol === 5) {
        return false
      }

      // No piece can pass through corners (even if empty)
      if (isCorner(currentRow, currentCol)) {
        return false
      }

      currentRow += rowDir
      currentCol += colDir
    }

    return true
  }

  function getValidMoves(position: Position): Position[] {
    const piece = board[position.row][position.col]
    if (!piece) return []

    const moves: Position[] = []

    // Check all four directions
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]

    for (const [rowDir, colDir] of directions) {
      for (let i = 1; i < 11; i++) {
        const newRow = position.row + rowDir * i
        const newCol = position.col + colDir * i

        if (newRow < 0 || newRow >= 11 || newCol < 0 || newCol >= 11) break

        const targetPos = { row: newRow, col: newCol }
        if (isValidMove(position, targetPos, piece)) {
          moves.push(targetPos)
        } else {
          break
        }
      }
    }

    return moves
  }

  function handleSquareClick(row: number, col: number) {
    // Disable input during AI turn or when AI is thinking
    if (gameMode === 'ai') {
      const aiRole = playerRole === 'attacker' ? 'defender' : 'attacker'
      if (currentPlayer === aiRole || isAIThinking) {
        return
      }
    }

    const clickedPos = { row, col }
    const piece = board[row][col]

    if (selectedSquare) {
      // Check if clicking on a valid move
      const isValidMoveClick = validMoves.some(move => move.row === row && move.col === col)

      if (isValidMoveClick) {
        // Make the move
        makeMove(selectedSquare, clickedPos)
        setSelectedSquare(null)
        setValidMoves([])
      } else if (piece && canPlayerMovePiece(piece, currentPlayer)) {
        // Select new piece
        setSelectedSquare(clickedPos)
        setValidMoves(getValidMoves(clickedPos))
        setCapturePreview([])
      } else {
        // Deselect
        setSelectedSquare(null)
        setValidMoves([])
        setCapturePreview([])
      }
    } else {
      // Select piece if it belongs to current player
      if (piece && canPlayerMovePiece(piece, currentPlayer)) {
        setSelectedSquare(clickedPos)
        setValidMoves(getValidMoves(clickedPos))
        setCapturePreview([])
      }
    }
  }

  function canPlayerMovePiece(piece: PieceType, player: 'attacker' | 'defender'): boolean {
    // In AI mode, only allow player to move their own pieces
    if (gameMode === 'ai') {
      const isPlayerTurn = player === playerRole
      if (!isPlayerTurn) return false
    }

    if (player === 'attacker') {
      return piece === 'attacker'
    } else {
      return piece === 'defender' || piece === 'king'
    }
  }

  function makeMove(from: Position, to: Position) {
    const piece = board[from.row][from.col]
    if (!piece) return

    const newBoard = board.map(row => [...row])
    newBoard[to.row][to.col] = piece
    newBoard[from.row][from.col] = null

    // Check for captures
    const captures = checkCaptures(to, newBoard)
    captures.forEach(capturePos => {
      newBoard[capturePos.row][capturePos.col] = null
    })

    setBoard(newBoard)

    // Add to move history
    const move: Move = { from, to, piece }
    setMoveHistory(prev => [...prev, move])
    setLastMove(move)

    // Check win conditions
    const winner = checkWinCondition(newBoard)
    if (winner) {
      setGameStatus(winner)
    } else {
      // Switch players
      setCurrentPlayer(currentPlayer === 'attacker' ? 'defender' : 'attacker')
    }
  }

  function checkCaptures(position: Position, boardState: BoardState): Position[] {
    const captures: Position[] = []
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    const currentPiece = boardState[position.row][position.col]

    for (const [rowDir, colDir] of directions) {
      const adjacentRow = position.row + rowDir
      const adjacentCol = position.col + colDir
      const oppositeRow = position.row + rowDir * 2
      const oppositeCol = position.col + colDir * 2

      // Check bounds for adjacent square
      if (adjacentRow < 0 || adjacentRow >= 11 || adjacentCol < 0 || adjacentCol >= 11) continue

      const adjacentPiece = boardState[adjacentRow][adjacentCol]

      // Can't capture empty squares or same team pieces
      if (!adjacentPiece || adjacentPiece === currentPiece) continue

      // Special rules for capturing the king - skip for now, handle in win condition
      if (adjacentPiece === 'king') {
        continue
      }

      // Regular piece capture rules
      let canCapture = false

      // Check if opposite square is out of bounds (edge capture)
      if (oppositeRow < 0 || oppositeRow >= 11 || oppositeCol < 0 || oppositeCol >= 11) {
        // Edge capture - piece is trapped against board edge
        canCapture = true
      } else {
        const oppositePiece = boardState[oppositeRow][oppositeCol]

        // Standard sandwich capture - piece must be between two hostile squares
        canCapture =
          oppositePiece === currentPiece || // Friendly piece
          (oppositeRow === 5 && oppositeCol === 5) || // Throne (empty or occupied by king)
          isCorner(oppositeRow, oppositeCol) // Corner (empty or occupied)
      }

      if (canCapture && isEnemyPiece(adjacentPiece, currentPiece)) {
        captures.push({ row: adjacentRow, col: adjacentCol })
      }
    }

    return captures
  }

  function isEnemyPiece(piece: PieceType, currentPiece: PieceType): boolean {
    if (!piece || !currentPiece) return false

    if (currentPiece === 'attacker') {
      return piece === 'defender' || piece === 'king'
    } else {
      return piece === 'attacker'
    }
  }

  function getAdjacentSquares(row: number, col: number): Position[] {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    const adjacent: Position[] = []

    for (const [rowDir, colDir] of directions) {
      const newRow = row + rowDir
      const newCol = col + colDir

      if (newRow >= 0 && newRow < 11 && newCol >= 0 && newCol < 11) {
        adjacent.push({ row: newRow, col: newCol })
      }
    }

    return adjacent
  }

  function isKingSurroundedOnThrone(boardState: BoardState): boolean {
    // King on throne (5,5) must be surrounded by attackers on all 4 sides
    const throneAdjacent = [
      { row: 4, col: 5 }, // North
      { row: 6, col: 5 }, // South
      { row: 5, col: 4 }, // West
      { row: 5, col: 6 }, // East
    ]

    return throneAdjacent.every(pos => boardState[pos.row][pos.col] === 'attacker')
  }

  function isKingCompletelyTrapped(kingPos: Position, boardState: BoardState): boolean {
    // King in normal position must be surrounded on all 4 sides by attackers or hostile squares
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]

    return directions.every(([rowDir, colDir]) => {
      const adjRow = kingPos.row + rowDir
      const adjCol = kingPos.col + colDir

      // Board edge counts as hostile
      if (adjRow < 0 || adjRow >= 11 || adjCol < 0 || adjCol >= 11) {
        return true
      }

      const adjPiece = boardState[adjRow][adjCol]

      // Attacker, empty throne, or empty corner counts as hostile
      return (
        adjPiece === 'attacker' ||
        (adjRow === 5 && adjCol === 5 && !adjPiece) ||
        (isCorner(adjRow, adjCol) && !adjPiece)
      )
    })
  }

  function isCorner(row: number, col: number): boolean {
    return (
      (row === 0 && col === 0) ||
      (row === 0 && col === 10) ||
      (row === 10 && col === 0) ||
      (row === 10 && col === 10)
    )
  }

  function checkWinCondition(boardState: BoardState): 'attacker_wins' | 'defender_wins' | null {
    // Find king
    let kingPos: Position | null = null
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        if (boardState[row][col] === 'king') {
          kingPos = { row, col }
          break
        }
      }
      if (kingPos) break
    }

    // If king is captured, attackers win
    if (!kingPos) {
      return 'attacker_wins'
    }

    // If king reaches corner, defenders win
    if (isCorner(kingPos.row, kingPos.col)) {
      return 'defender_wins'
    }

    // Check if king is surrounded (alternative attacker win condition)
    if (isKingSurrounded(kingPos, boardState)) {
      return 'attacker_wins'
    }

    return null
  }

  function isKingSurrounded(kingPos: Position, boardState: BoardState): boolean {
    // Special case: King on throne
    if (kingPos.row === 5 && kingPos.col === 5) {
      return isKingSurroundedOnThrone(boardState)
    }

    // Special case: King on corner (already won, shouldn't be captured)
    if (isCorner(kingPos.row, kingPos.col)) {
      return false
    }

    // Special case: King adjacent to throne
    const adjacentToThrone = getAdjacentSquares(5, 5).some(
      pos => pos.row === kingPos.row && pos.col === kingPos.col
    )

    if (adjacentToThrone) {
      // King next to throne needs 3 attackers (throne counts as 4th side)
      const adjacentSquares = getAdjacentSquares(kingPos.row, kingPos.col)
      const attackerCount = adjacentSquares.filter(
        pos => boardState[pos.row][pos.col] === 'attacker'
      ).length

      // Check if throne is acting as hostile square
      const throneIsHostile = adjacentSquares.some(
        pos => pos.row === 5 && pos.col === 5 && !boardState[pos.row][pos.col]
      )

      return attackerCount >= 3 && throneIsHostile
    }

    // King in normal position - check all 4 directions
    return isKingCompletelyTrapped(kingPos, boardState)
  }

  // AI move logic
  async function makeAIMove() {
    if (gameMode !== 'ai' || gameStatus !== 'playing') return

    const aiRole = playerRole === 'attacker' ? 'defender' : 'attacker'
    if (currentPlayer !== aiRole) return

    setIsAIThinking(true)

    try {
      // Get AI move using simple logic for now
      const aiMove = getAIMove(board, aiRole)

      if (aiMove) {
        // Show the AI's selected piece briefly
        setSelectedSquare(aiMove.from)
        setValidMoves(getValidMoves(aiMove.from))

        // Simulate AI thinking time based on difficulty
        const thinkingTime = aiLevel === 'easy' ? 800 : aiLevel === 'medium' ? 1500 : 2500
        await new Promise(resolve => setTimeout(resolve, thinkingTime))

        // Make the move
        makeMove(aiMove.from, aiMove.to)
        setSelectedSquare(null)
        setValidMoves([])
      }
    } catch (error) {
      console.error('AI move error:', error)
    } finally {
      setIsAIThinking(false)
    }
  }

  // Simple AI move selection (can be enhanced with the full AI engine later)
  function getAIMove(boardState: BoardState, role: 'attacker' | 'defender'): Move | null {
    const possibleMoves: Move[] = []

    // Find all possible moves for the AI
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const piece = boardState[row][col]
        if (!piece) continue

        // Check if this piece belongs to the AI
        const belongsToAI =
          (role === 'attacker' && piece === 'attacker') ||
          (role === 'defender' && (piece === 'defender' || piece === 'king'))

        if (!belongsToAI) continue

        // Get valid moves for this piece
        const validMovesForPiece = getValidMoves({ row, col })

        for (const move of validMovesForPiece) {
          possibleMoves.push({
            from: { row, col },
            to: move,
            piece,
          })
        }
      }
    }

    if (possibleMoves.length === 0) return null

    // Simple AI: prioritize captures, then random move
    const movesWithCaptures = possibleMoves.filter(move => {
      const tempBoard = boardState.map(row => [...row])
      tempBoard[move.to.row][move.to.col] = move.piece
      tempBoard[move.from.row][move.from.col] = null
      const captures = checkCaptures(move.to, tempBoard)
      return captures.length > 0
    })

    const selectedMoves = movesWithCaptures.length > 0 ? movesWithCaptures : possibleMoves
    return selectedMoves[Math.floor(Math.random() * selectedMoves.length)]
  }

  // Effect to trigger AI moves
  useEffect(() => {
    if (gameMode === 'ai' && gameStatus === 'playing') {
      const aiRole = playerRole === 'attacker' ? 'defender' : 'attacker'
      if (currentPlayer === aiRole && !isAIThinking) {
        const timer = setTimeout(() => {
          makeAIMove()
        }, 1000) // Small delay for better UX

        return () => clearTimeout(timer)
      }
    }
  }, [currentPlayer, gameMode, gameStatus, isAIThinking])

  // Set AI opponent name based on level
  useEffect(() => {
    if (gameMode === 'ai') {
      const aiNames = {
        easy: 'Viking Novice',
        medium: 'Berserker Tactician',
        hard: 'Grandmaster Warlord',
      }
      setAiOpponent(aiNames[aiLevel as keyof typeof aiNames] || 'AI Opponent')
    }
  }, [gameMode, aiLevel])

  function resetGame() {
    setBoard(createInitialBoard())
    setCurrentPlayer('attacker')
    setSelectedSquare(null)
    setValidMoves([])
    setGameStatus('playing')
    setMoveHistory([])
    setLastMove(null)
    setCapturePreview([])
    setIsAIThinking(false)
  }

  // Viking-style wooden piece components
  function PieceComponent({
    piece,
    isSelected,
    isLastMove,
  }: {
    piece: PieceType
    isSelected: boolean
    isLastMove: boolean
  }) {
    if (!piece) return null

    const baseClasses = 'w-full h-full flex items-center justify-center transition-all duration-300'
    const selectedClass = isSelected ? 'transform scale-110 drop-shadow-2xl' : 'hover:scale-105'
    const lastMoveClass = isLastMove ? 'animate-pulse-slow' : ''

    switch (piece) {
      case 'king':
        return (
          <div className={`${baseClasses} ${selectedClass} ${lastMoveClass}`}>
            <div className="relative">
              {/* Light wooden king piece with golden crown */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 rounded-full flex items-center justify-center shadow-xl border-4 border-yellow-500 relative overflow-hidden piece-wood-grain">
                {/* Light wood grain texture */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/30 via-transparent to-amber-600/20 rounded-full"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(254,240,138,0.4),transparent_50%)] rounded-full"></div>

                {/* Golden crown highlight */}
                <div className="absolute inset-1 bg-gradient-to-br from-yellow-300/40 to-transparent rounded-full"></div>

                {/* Norse crown symbol */}
                <div className="relative z-10 text-amber-900 text-lg sm:text-xl font-bold drop-shadow-sm norse-symbol">
                  ♔
                </div>

                {/* Carved details - light wood */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-200/60 rounded-full blur-sm"></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-amber-700/40 rounded-full"></div>

                {/* Crown jewels */}
                <div className="absolute top-0.5 left-1/2 w-1 h-1 bg-red-500/80 rounded-full transform -translate-x-1/2"></div>
                <div className="absolute top-1 left-1/3 w-0.5 h-0.5 bg-blue-500/80 rounded-full"></div>
                <div className="absolute top-1 right-1/3 w-0.5 h-0.5 bg-emerald-500/80 rounded-full"></div>
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-50"></div>
              )}
            </div>
          </div>
        )
      case 'defender':
        return (
          <div className={`${baseClasses} ${selectedClass} ${lastMoveClass}`}>
            <div className="relative">
              {/* Light wooden defender piece with shield symbol */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 rounded-full flex items-center justify-center shadow-lg border-3 border-amber-400 relative overflow-hidden piece-wood-grain">
                {/* Light wood grain texture */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/30 via-transparent to-amber-500/20 rounded-full"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_25%,rgba(254,243,199,0.4),transparent_50%)] rounded-full"></div>

                {/* Shield highlight */}
                <div className="absolute inset-1 bg-gradient-to-br from-amber-200/40 to-transparent rounded-full"></div>

                {/* Shield symbol */}
                <div className="relative z-10 text-amber-800 text-sm sm:text-base font-bold drop-shadow-sm norse-symbol">
                  🛡
                </div>

                {/* Carved details - light wood */}
                <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-yellow-200/50 rounded-full blur-sm"></div>
                <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-amber-600/40 rounded-full"></div>

                {/* Shield decorations */}
                <div className="absolute top-1 left-1/2 w-0.5 h-2 bg-amber-600/60 rounded-full transform -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-1 w-2 h-0.5 bg-amber-600/60 rounded-full transform -translate-y-1/2"></div>
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-amber-300 rounded-full animate-ping opacity-50"></div>
              )}
            </div>
          </div>
        )
      case 'attacker':
        return (
          <div className={`${baseClasses} ${selectedClass} ${lastMoveClass}`}>
            <div className="relative">
              {/* Dark wooden attacker piece with axe symbol */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-full flex items-center justify-center shadow-xl border-3 border-gray-700 relative overflow-hidden piece-wood-grain">
                {/* Dark wood grain texture */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-transparent to-black/50 rounded-full"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(75,85,99,0.4),transparent_50%)] rounded-full"></div>

                {/* Dark wood highlight */}
                <div className="absolute inset-1 bg-gradient-to-br from-gray-600/20 to-transparent rounded-full"></div>

                {/* Viking axe symbol */}
                <div className="relative z-10 text-gray-200 text-sm sm:text-base font-bold drop-shadow-lg norse-symbol">
                  ⚔
                </div>

                {/* Carved details - dark wood */}
                <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-gray-600/40 rounded-full blur-sm"></div>
                <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-black/80 rounded-full"></div>

                {/* Axe blade details */}
                <div className="absolute top-1 right-1 w-1 h-1 bg-red-600/60 rounded-full"></div>
                <div className="absolute bottom-1 left-1 w-0.5 h-1.5 bg-gray-500/60 rounded-full"></div>
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-gray-500 rounded-full animate-ping opacity-50"></div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  function getSquareStyle(row: number, col: number, piece: PieceType) {
    const isSelected = selectedSquare?.row === row && selectedSquare?.col === col
    const isValidMove = validMoves.some(move => move.row === row && move.col === col)
    const isThrone = row === 5 && col === 5
    const isCornerSquare = isCorner(row, col)
    const isLastMoveSquare =
      lastMove &&
      ((lastMove.from.row === row && lastMove.from.col === col) ||
        (lastMove.to.row === row && lastMove.to.col === col))

    let baseClasses =
      'viking-board-square flex items-center justify-center relative rounded-lg border-2 shadow-sm wood-texture viking-piece'

    // Border and shadow effects
    if (isSelected) {
      baseClasses +=
        ' border-blue-400 shadow-lg shadow-blue-400/50 ring-2 ring-blue-300 ring-opacity-50'
    } else if (isValidMove) {
      baseClasses +=
        ' border-green-400 shadow-md shadow-green-400/30 ring-2 ring-green-300 ring-opacity-30'
    } else {
      baseClasses += ' border-gray-300 hover:border-gray-400'
    }

    // Viking wooden board colors with natural wood grain
    if (isSelected) {
      baseClasses += ' bg-gradient-to-br from-amber-200 to-amber-300 border-amber-500'
    } else if (isValidMove) {
      baseClasses +=
        ' bg-gradient-to-br from-emerald-200 to-emerald-300 hover:from-emerald-250 hover:to-emerald-350 border-emerald-500'
    } else if (isThrone && !piece) {
      // Ornate throne square with Celtic pattern
      baseClasses +=
        ' bg-gradient-to-br from-amber-300 to-amber-400 border-amber-600 relative throne-glow'
    } else if (isCornerSquare && !piece) {
      // Corner squares with Norse knotwork
      baseClasses +=
        ' bg-gradient-to-br from-amber-400 to-amber-500 border-amber-700 relative corner-glow'
    } else if (isLastMoveSquare) {
      baseClasses += ' bg-gradient-to-br from-blue-200 to-blue-300 border-blue-400'
    } else {
      // Natural wood grain pattern
      const isLight = (row + col) % 2 === 0
      baseClasses += isLight
        ? ' bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-150 border-amber-200'
        : ' bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-150 hover:to-amber-250 border-amber-300'
    }

    return baseClasses
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="glass-card rounded-none border-0 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold gradient-text">Viking Chess</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/game/ai" className="modern-button-secondary text-sm">
                🤖 AI Challenge
              </Link>
              <Link href="/" className="modern-button-secondary text-sm">
                ← Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
                gameMode === 'ai' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  gameMode === 'ai' ? 'bg-purple-500' : 'bg-blue-500'
                }`}
              ></span>
              <span>
                {gameMode === 'ai' ? `AI Battle • vs ${aiOpponent}` : 'Practice Mode • Local Game'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent norse-symbol">
                ᚺᚾᛖᚠᚨᛏᚨᚠᛚ
              </span>
            </h1>
            <h2 className="text-2xl font-semibold text-amber-700 mb-4">Hnefatafl</h2>
            <p className="text-lg text-amber-800 mb-6 font-medium">
              Master the Ancient Viking Strategy Game
            </p>

            <div className="flex justify-center items-center gap-6 mb-8">
              <div
                className={`glass-card px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  currentPlayer === 'attacker'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl transform scale-105 ring-4 ring-red-200'
                    : 'text-gray-600 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <div className="font-bold">
                      {gameMode === 'ai' && playerRole === 'defender' ? aiOpponent : 'Dark Forces'}
                    </div>
                    <div className="text-xs opacity-75">Attackers</div>
                    {currentPlayer === 'attacker' && (
                      <div className="text-sm opacity-90">
                        {gameMode === 'ai' && playerRole === 'defender'
                          ? isAIThinking
                            ? 'Thinking...'
                            : 'AI Turn'
                          : 'Your Turn'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-3xl animate-pulse">⚡</div>

              <div
                className={`glass-card px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  currentPlayer === 'defender'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl transform scale-105 ring-4 ring-blue-200'
                    : 'text-gray-600 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <div className="font-bold">
                      {gameMode === 'ai' && playerRole === 'attacker' ? aiOpponent : 'Light Forces'}
                    </div>
                    <div className="text-xs opacity-75">Defenders</div>
                    {currentPlayer === 'defender' && (
                      <div className="text-sm opacity-90">
                        {gameMode === 'ai' && playerRole === 'attacker'
                          ? isAIThinking
                            ? 'Thinking...'
                            : 'AI Turn'
                          : 'Your Turn'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {gameStatus !== 'playing' && (
              <div className="mb-8 glass-card rounded-3xl p-8 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200">
                <div className="text-center">
                  <div
                    className={`text-5xl mb-4 ${
                      gameStatus === 'attacker_wins' ? 'text-red-500' : 'text-blue-500'
                    }`}
                  >
                    {gameStatus === 'attacker_wins' ? '⚔️' : '🛡️'}
                  </div>
                  <div
                    className={`text-3xl font-bold mb-4 ${
                      gameStatus === 'attacker_wins' ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    {gameStatus === 'attacker_wins' ? 'Attackers Victory!' : 'Defenders Victory!'}
                  </div>
                  <p className="text-xl text-gray-600 mb-6">
                    {gameStatus === 'attacker_wins'
                      ? 'The king has been captured or surrounded!'
                      : 'The king has escaped to a corner!'}
                  </p>
                  <button onClick={resetGame} className="modern-button-primary text-lg px-8 py-4">
                    <span className="flex items-center space-x-2">
                      <span>🎮</span>
                      <span>New Game</span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col xl:flex-row gap-8 items-start">
            {/* Viking Game Board */}
            <div className="flex-1 flex justify-center">
              <div className="relative p-8 rounded-3xl shadow-2xl bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 board-edge-decoration">
                {/* Outer Celtic border frame */}
                <div className="absolute inset-2 border-8 border-amber-700 rounded-3xl celtic-border">
                  {/* Corner Celtic knots */}
                  <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full border-4 border-amber-500 flex items-center justify-center">
                    <span className="text-amber-200 text-lg font-bold norse-symbol">ᚦ</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full border-4 border-amber-500 flex items-center justify-center">
                    <span className="text-amber-200 text-lg font-bold norse-symbol">ᚱ</span>
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full border-4 border-amber-500 flex items-center justify-center">
                    <span className="text-amber-200 text-lg font-bold norse-symbol">ᚢ</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full border-4 border-amber-500 flex items-center justify-center">
                    <span className="text-amber-200 text-lg font-bold norse-symbol">ᚾ</span>
                  </div>

                  {/* Side decorations */}
                  <div className="absolute top-1/2 -left-1 w-8 h-16 bg-gradient-to-r from-amber-600 to-amber-700 rounded-r-lg transform -translate-y-1/2 flex items-center justify-center">
                    <span className="text-amber-200 text-sm norse-symbol">ᛟ</span>
                  </div>
                  <div className="absolute top-1/2 -right-1 w-8 h-16 bg-gradient-to-l from-amber-600 to-amber-700 rounded-l-lg transform -translate-y-1/2 flex items-center justify-center">
                    <span className="text-amber-200 text-sm norse-symbol">ᛗ</span>
                  </div>
                  <div className="absolute -top-1 left-1/2 w-16 h-8 bg-gradient-to-b from-amber-600 to-amber-700 rounded-b-lg transform -translate-x-1/2 flex items-center justify-center">
                    <span className="text-amber-200 text-sm norse-symbol">ᛚ</span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 w-16 h-8 bg-gradient-to-t from-amber-600 to-amber-700 rounded-t-lg transform -translate-x-1/2 flex items-center justify-center">
                    <span className="text-amber-200 text-sm norse-symbol">ᛒ</span>
                  </div>
                </div>

                {/* Inner decorative border */}
                <div className="absolute inset-6 border-4 border-amber-600 rounded-2xl bg-gradient-to-br from-amber-300/20 to-amber-500/20"></div>

                {/* Wood grain texture overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-700/20 via-transparent to-amber-900/30 rounded-3xl pointer-events-none wood-texture"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(245,158,11,0.1),transparent_50%)] rounded-3xl pointer-events-none"></div>

                <div className="relative grid grid-cols-11 gap-1 bg-gradient-to-br from-amber-200 via-amber-100 to-amber-200 p-6 rounded-2xl shadow-inner border-4 border-amber-500 wood-texture">
                  {board.map((row, rowIndex) =>
                    row.map((piece, colIndex) => {
                      const isLastMoveSquare =
                        lastMove &&
                        ((lastMove.from.row === rowIndex && lastMove.from.col === colIndex) ||
                          (lastMove.to.row === rowIndex && lastMove.to.col === colIndex))

                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleSquareClick(rowIndex, colIndex)}
                          onMouseEnter={() => {
                            if (
                              selectedSquare &&
                              validMoves.some(
                                move => move.row === rowIndex && move.col === colIndex
                              )
                            ) {
                              // Show capture preview
                              const tempBoard = board.map(row => [...row])
                              tempBoard[rowIndex][colIndex] =
                                tempBoard[selectedSquare.row][selectedSquare.col]
                              tempBoard[selectedSquare.row][selectedSquare.col] = null
                              const captures = checkCaptures(
                                { row: rowIndex, col: colIndex },
                                tempBoard
                              )
                              setCapturePreview(captures)
                            }
                          }}
                          onMouseLeave={() => setCapturePreview([])}
                          className={getSquareStyle(rowIndex, colIndex, piece)}
                          disabled={gameStatus !== 'playing'}
                        >
                          <PieceComponent
                            piece={piece}
                            isSelected={
                              selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
                            }
                            isLastMove={isLastMoveSquare}
                          />

                          {/* Valid move indicator */}
                          {validMoves.some(
                            move => move.row === rowIndex && move.col === colIndex
                          ) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-green-400 rounded-full opacity-80 animate-pulse border-2 border-green-300 shadow-lg"></div>
                            </div>
                          )}

                          {/* Special square indicators */}
                          {rowIndex === 5 && colIndex === 5 && !piece && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              {/* Ornate throne with Celtic cross */}
                              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center border-2 border-amber-700 shadow-lg relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-300/40 via-transparent to-amber-800/40 rounded-lg"></div>
                                <span className="relative text-amber-900 text-sm font-bold drop-shadow">
                                  ⚜
                                </span>
                                {/* Corner decorations */}
                                <div className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-amber-300 rounded-full"></div>
                                <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-amber-300 rounded-full"></div>
                                <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-amber-300 rounded-full"></div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-amber-300 rounded-full"></div>
                              </div>
                            </div>
                          )}
                          {isCorner(rowIndex, colIndex) && !piece && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              {/* Norse corner markers with knotwork */}
                              <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center border-2 border-amber-800 shadow-md relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 via-transparent to-amber-900/50 rounded-lg"></div>
                                <span className="relative text-amber-100 text-xs font-bold drop-shadow">
                                  ◊
                                </span>
                                {/* Knotwork pattern */}
                                <div className="absolute top-0 left-1 w-0.5 h-2 bg-amber-300/60 rounded-full transform rotate-45"></div>
                                <div className="absolute top-0 right-1 w-0.5 h-2 bg-amber-300/60 rounded-full transform -rotate-45"></div>
                              </div>
                            </div>
                          )}

                          {/* Capture preview indicators */}
                          {capturePreview.some(
                            pos => pos.row === rowIndex && pos.col === colIndex
                          ) && (
                            <div className="absolute inset-0 bg-red-400 bg-opacity-50 rounded-lg border-2 border-red-500 animate-pulse">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">✕</span>
                              </div>
                            </div>
                          )}

                          {/* Selected piece indicator */}
                          {gameStatus === 'playing' &&
                            selectedSquare &&
                            selectedSquare.row === rowIndex &&
                            selectedSquare.col === colIndex && (
                              <div className="absolute -top-1 -right-1">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                              </div>
                            )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Game Info Panel */}
            <div className="w-full xl:w-96">
              {/* AI Status Indicator */}
              {gameMode === 'ai' && isAIThinking && (
                <div className="glass-card rounded-2xl p-4 mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <div className="font-semibold text-purple-800">
                        {aiOpponent} is thinking...
                      </div>
                      <div className="text-sm text-purple-600">Planning the next move</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="glass-card rounded-2xl p-6 space-y-6">
                <h3 className="text-2xl font-bold gradient-text mb-6">Game Rules</h3>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-300">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                      <span className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm mr-3">
                        ⚔️
                      </span>
                      Dark Forces Goal
                    </h4>
                    <p className="text-gray-700 ml-11">
                      Capture the king by surrounding it on all four sides
                    </p>
                    <div className="text-xs text-gray-600 ml-11 mt-1">
                      Dark wooden pieces (Attackers)
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                    <h4 className="font-bold text-amber-800 mb-2 flex items-center">
                      <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm mr-3">
                        🛡️
                      </span>
                      Light Forces Goal
                    </h4>
                    <p className="text-amber-700 ml-11">
                      Help the king escape to any corner square
                    </p>
                    <div className="text-xs text-amber-600 ml-11 mt-1">
                      Light wooden pieces (Defenders + King)
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <span className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm mr-3">
                        🎯
                      </span>
                      How to Play
                    </h4>
                    <ul className="text-gray-700 space-y-2 ml-11">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>Click a piece
                        to select it
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>Click
                        highlighted squares to move
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>Pieces move
                        like rooks in chess
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>Capture by
                        sandwiching enemies
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>Special
                        squares aid in captures
                      </li>
                    </ul>
                  </div>
                </div>

                {moveHistory.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <span className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm mr-3">
                        📋
                      </span>
                      Move History
                    </h4>
                    <div className="max-h-48 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                      {moveHistory.slice(-10).map((move, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 px-3 mb-2 bg-white rounded-lg shadow-sm border border-gray-100 last:mb-0"
                        >
                          <span className="font-bold text-gray-600 text-sm">
                            {moveHistory.length - 10 + index + 1}.
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {move.piece === 'king' ? '♔' : move.piece === 'defender' ? '♗' : '♜'}
                            </span>
                            <span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {String.fromCharCode(97 + move.from.col)}
                              {11 - move.from.row} → {String.fromCharCode(97 + move.to.col)}
                              {11 - move.to.row}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button onClick={resetGame} className="w-full modern-button-secondary">
                  <span className="flex items-center justify-center space-x-2">
                    <span>🔄</span>
                    <span>Reset Game</span>
                  </span>
                </button>
                <Link href="/" className="block w-full text-center modern-button-primary">
                  <span className="flex items-center justify-center space-x-2">
                    <span>🏠</span>
                    <span>Back to Home</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
