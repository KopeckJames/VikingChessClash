'use client'

import { useState, useEffect } from 'react'

type PieceType = 'king' | 'defender' | 'attacker' | null
type BoardState = PieceType[][]
type Position = { row: number; col: number }

interface Move {
  from: Position
  to: Position
  piece: PieceType
}

export default function GamePage() {
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard())
  const [currentPlayer, setCurrentPlayer] = useState<'attacker' | 'defender'>('attacker')
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [gameStatus, setGameStatus] = useState<'playing' | 'attacker_wins' | 'defender_wins'>(
    'playing'
  )
  const [moveHistory, setMoveHistory] = useState<Move[]>([])

  function createInitialBoard(): BoardState {
    const board: BoardState = Array(11)
      .fill(null)
      .map(() => Array(11).fill(null))

    // Place attackers
    const attackerPositions = [
      // Top row
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
      [0, 7],
      // Second row
      [1, 5],
      // Left side
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 0],
      [7, 0],
      // Right side
      [3, 10],
      [4, 10],
      [5, 10],
      [6, 10],
      [7, 10],
      // Bottom left
      [9, 5],
      // Bottom row
      [10, 3],
      [10, 4],
      [10, 5],
      [10, 6],
      [10, 7],
    ]

    attackerPositions.forEach(([row, col]) => {
      board[row][col] = 'attacker'
    })

    // Place defenders
    const defenderPositions = [
      [2, 5],
      [3, 4],
      [3, 5],
      [3, 6],
      [4, 3],
      [4, 4],
      [4, 6],
      [4, 7],
      [5, 2],
      [5, 3],
      [5, 4],
      [5, 6],
      [5, 7],
      [5, 8],
      [6, 3],
      [6, 4],
      [6, 6],
      [6, 7],
      [7, 4],
      [7, 5],
      [7, 6],
      [8, 5],
    ]

    defenderPositions.forEach(([row, col]) => {
      board[row][col] = 'defender'
    })

    // Place king
    board[5][5] = 'king'

    return board
  }

  function isValidMove(from: Position, to: Position, piece: PieceType): boolean {
    if (!piece) return false

    // Can't move to occupied square
    if (board[to.row][to.col] !== null) return false

    // Must move in straight line
    if (from.row !== to.row && from.col !== to.col) return false

    // Check if path is clear
    const rowDir = to.row > from.row ? 1 : to.row < from.row ? -1 : 0
    const colDir = to.col > from.col ? 1 : to.col < from.col ? -1 : 0

    let currentRow = from.row + rowDir
    let currentCol = from.col + colDir

    while (currentRow !== to.row || currentCol !== to.col) {
      if (board[currentRow][currentCol] !== null) return false
      currentRow += rowDir
      currentCol += colDir
    }

    // King can't move to corners unless it's an escape
    if (piece === 'king') {
      const corners = [
        [0, 0],
        [0, 10],
        [10, 0],
        [10, 10],
      ]
      const isCorner = corners.some(([r, c]) => r === to.row && c === to.col)
      if (isCorner) {
        // This would be a win condition, allow it
        return true
      }
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
      } else {
        // Deselect
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else {
      // Select piece if it belongs to current player
      if (piece && canPlayerMovePiece(piece, currentPlayer)) {
        setSelectedSquare(clickedPos)
        setValidMoves(getValidMoves(clickedPos))
      }
    }
  }

  function canPlayerMovePiece(piece: PieceType, player: 'attacker' | 'defender'): boolean {
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

    for (const [rowDir, colDir] of directions) {
      const adjacentRow = position.row + rowDir
      const adjacentCol = position.col + colDir
      const oppositeRow = position.row + rowDir * 2
      const oppositeCol = position.col + colDir * 2

      if (
        adjacentRow >= 0 &&
        adjacentRow < 11 &&
        adjacentCol >= 0 &&
        adjacentCol < 11 &&
        oppositeRow >= 0 &&
        oppositeRow < 11 &&
        oppositeCol >= 0 &&
        oppositeCol < 11
      ) {
        const adjacentPiece = boardState[adjacentRow][adjacentCol]
        const oppositePiece = boardState[oppositeRow][oppositeCol]
        const currentPiece = boardState[position.row][position.col]

        if (adjacentPiece && adjacentPiece !== currentPiece && adjacentPiece !== 'king') {
          if (
            oppositePiece === currentPiece ||
            (oppositeRow === 5 && oppositeCol === 5) || // Throne
            isCorner(oppositeRow, oppositeCol)
          ) {
            captures.push({ row: adjacentRow, col: adjacentCol })
          }
        }
      }
    }

    return captures
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
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    let surroundedSides = 0

    for (const [rowDir, colDir] of directions) {
      const adjRow = kingPos.row + rowDir
      const adjCol = kingPos.col + colDir

      // Check if adjacent square is blocked by attacker, throne, or corner
      if (adjRow < 0 || adjRow >= 11 || adjCol < 0 || adjCol >= 11) {
        // Edge of board
        surroundedSides++
      } else if (boardState[adjRow][adjCol] === 'attacker') {
        surroundedSides++
      } else if (adjRow === 5 && adjCol === 5 && boardState[adjRow][adjCol] === null) {
        // Empty throne acts as hostile to king when surrounded
        surroundedSides++
      } else if (isCorner(adjRow, adjCol) && boardState[adjRow][adjCol] === null) {
        // Empty corners act as hostile to king when surrounded
        surroundedSides++
      }
    }

    // King must be surrounded on all 4 sides to be captured
    return surroundedSides >= 4
  }

  function resetGame() {
    setBoard(createInitialBoard())
    setCurrentPlayer('attacker')
    setSelectedSquare(null)
    setValidMoves([])
    setGameStatus('playing')
    setMoveHistory([])
  }

  function getPieceSymbol(piece: PieceType): string {
    switch (piece) {
      case 'king':
        return '♔'
      case 'defender':
        return '♗'
      case 'attacker':
        return '♜'
      default:
        return ''
    }
  }

  function getPieceColor(piece: PieceType): string {
    switch (piece) {
      case 'king':
        return 'text-yellow-600'
      case 'defender':
        return 'text-blue-600'
      case 'attacker':
        return 'text-red-600'
      default:
        return ''
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">🛡️ Hnefatafl (Viking Chess)</h1>
          <div className="flex justify-center items-center gap-4 mb-4">
            <div
              className={`px-4 py-2 rounded ${currentPlayer === 'attacker' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}
            >
              Attacker {currentPlayer === 'attacker' ? '(Your turn)' : ''}
            </div>
            <div
              className={`px-4 py-2 rounded ${currentPlayer === 'defender' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
            >
              Defender {currentPlayer === 'defender' ? '(Your turn)' : ''}
            </div>
          </div>
          {gameStatus !== 'playing' && (
            <div className="mb-4">
              <div
                className={`text-xl font-bold ${gameStatus === 'attacker_wins' ? 'text-red-600' : 'text-blue-600'}`}
              >
                {gameStatus === 'attacker_wins' ? '🔴 Attackers Win!' : '🔵 Defenders Win!'}
              </div>
              <button
                onClick={resetGame}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                New Game
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Game Board */}
          <div className="flex-1">
            <div className="inline-block bg-amber-100 p-4 rounded-lg shadow-lg">
              <div className="grid grid-cols-11 gap-1">
                {board.map((row, rowIndex) =>
                  row.map((piece, colIndex) => {
                    const isSelected =
                      selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
                    const isValidMove = validMoves.some(
                      move => move.row === rowIndex && move.col === colIndex
                    )
                    const isThrone = rowIndex === 5 && colIndex === 5
                    const isCornerSquare = isCorner(rowIndex, colIndex)

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                        className={`
                          w-8 h-8 sm:w-10 sm:h-10 border border-amber-800 flex items-center justify-center text-lg sm:text-xl font-bold
                          ${isSelected ? 'bg-yellow-300' : ''}
                          ${isValidMove ? 'bg-green-200 hover:bg-green-300' : ''}
                          ${isThrone && !piece ? 'bg-amber-300' : ''}
                          ${isCornerSquare && !piece ? 'bg-amber-400' : ''}
                          ${!isSelected && !isValidMove && !isThrone && !isCornerSquare ? 'bg-amber-50 hover:bg-amber-100' : ''}
                          transition-colors duration-150
                        `}
                        disabled={gameStatus !== 'playing'}
                      >
                        <span className={getPieceColor(piece)}>{getPieceSymbol(piece)}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="w-full lg:w-80">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Game Rules</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-red-600">♜ Attackers</span>: Capture the king
                </p>
                <p>
                  <span className="text-blue-600">♗ Defenders</span>: Protect the king
                </p>
                <p>
                  <span className="text-yellow-600">♔ King</span>: Escape to any corner
                </p>
              </div>

              <h4 className="font-semibold mt-4 mb-2">How to Play:</h4>
              <ul className="text-sm space-y-1">
                <li>• Click a piece to select it</li>
                <li>• Click a highlighted square to move</li>
                <li>• Pieces move like rooks in chess</li>
                <li>• Capture by surrounding enemies</li>
                <li>• Throne and corners help capture</li>
              </ul>

              {moveHistory.length > 0 && (
                <>
                  <h4 className="font-semibold mt-4 mb-2">Move History:</h4>
                  <div className="max-h-32 overflow-y-auto text-sm">
                    {moveHistory.map((move, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{index + 1}.</span>
                        <span>
                          {getPieceSymbol(move.piece)} {String.fromCharCode(97 + move.from.col)}
                          {11 - move.from.row} → {String.fromCharCode(97 + move.to.col)}
                          {11 - move.to.row}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={resetGame}
                className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
              >
                Reset Game
              </button>
              <a
                href="/"
                className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
