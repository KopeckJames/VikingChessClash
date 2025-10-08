'use client'

import { useState, useEffect } from 'react'

type PieceType = 'king' | 'defender' | 'attacker' | null
type BoardState = PieceType[][]
type Position = { row: number; col: number }
type AILevel = 'easy' | 'medium' | 'hard'

interface Move {
  from: Position
  to: Position
  piece: PieceType
}

export default function AIGamePage() {
  const [gameStarted, setGameStarted] = useState(false)
  const [aiLevel, setAiLevel] = useState<AILevel>('medium')
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard())
  const [currentPlayer, setCurrentPlayer] = useState<'attacker' | 'defender'>('attacker')
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [gameStatus, setGameStatus] = useState<'playing' | 'attacker_wins' | 'defender_wins'>(
    'playing'
  )
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [playerRole, setPlayerRole] = useState<'attacker' | 'defender'>('attacker')

  function createInitialBoard(): BoardState {
    const board: BoardState = Array(11)
      .fill(null)
      .map(() => Array(11).fill(null))

    // Place attackers
    const attackerPositions = [
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
      [0, 7],
      [1, 5],
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
      [9, 5],
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

  function startGame(level: AILevel, role: 'attacker' | 'defender') {
    setAiLevel(level)
    setPlayerRole(role)
    setGameStarted(true)
    setBoard(createInitialBoard())
    setCurrentPlayer('attacker')
    setGameStatus('playing')
    setMoveHistory([])

    // If player is defender, AI goes first
    if (role === 'defender') {
      setTimeout(() => makeAiMove(createInitialBoard(), 'attacker'), 1000)
    }
  }

  function isValidMove(
    from: Position,
    to: Position,
    piece: PieceType,
    boardState: BoardState
  ): boolean {
    if (!piece) return false
    if (boardState[to.row][to.col] !== null) return false
    if (from.row !== to.row && from.col !== to.col) return false

    const rowDir = to.row > from.row ? 1 : to.row < from.row ? -1 : 0
    const colDir = to.col > from.col ? 1 : to.col < from.col ? -1 : 0

    let currentRow = from.row + rowDir
    let currentCol = from.col + colDir

    while (currentRow !== to.row || currentCol !== to.col) {
      if (boardState[currentRow][currentCol] !== null) return false
      currentRow += rowDir
      currentCol += colDir
    }

    return true
  }

  function getValidMoves(position: Position, boardState: BoardState): Position[] {
    const piece = boardState[position.row][position.col]
    if (!piece) return []

    const moves: Position[] = []
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
        if (isValidMove(position, targetPos, piece, boardState)) {
          moves.push(targetPos)
        } else {
          break
        }
      }
    }

    return moves
  }

  function getAllPossibleMoves(player: 'attacker' | 'defender', boardState: BoardState): Move[] {
    const moves: Move[] = []

    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const piece = boardState[row][col]
        if (piece && canPlayerMovePiece(piece, player)) {
          const validMoves = getValidMoves({ row, col }, boardState)
          validMoves.forEach(to => {
            moves.push({ from: { row, col }, to, piece })
          })
        }
      }
    }

    return moves
  }

  function canPlayerMovePiece(piece: PieceType, player: 'attacker' | 'defender'): boolean {
    if (player === 'attacker') {
      return piece === 'attacker'
    } else {
      return piece === 'defender' || piece === 'king'
    }
  }

  function getBestMove(boardState: BoardState, player: 'attacker' | 'defender'): Move | null {
    const moves = getAllPossibleMoves(player, boardState)
    if (moves.length === 0) return null

    // Simple AI: random move with some basic strategy
    if (aiLevel === 'easy') {
      return moves[Math.floor(Math.random() * moves.length)]
    }

    // Medium/Hard: prefer moves that capture or protect king
    let bestMoves = moves

    if (player === 'attacker') {
      // Prefer moves that get closer to king or capture pieces
      bestMoves = moves.filter(move => {
        const newBoard = makeMove(move, boardState)
        const captures = checkCaptures(move.to, newBoard)
        return captures.length > 0
      })

      if (bestMoves.length === 0) bestMoves = moves
    } else {
      // Prefer moves that move king toward corners or protect it
      const kingMoves = moves.filter(move => move.piece === 'king')
      if (kingMoves.length > 0) {
        const cornerMoves = kingMoves.filter(move => {
          const distanceToCorner = Math.min(
            Math.abs(move.to.row - 0) + Math.abs(move.to.col - 0),
            Math.abs(move.to.row - 0) + Math.abs(move.to.col - 10),
            Math.abs(move.to.row - 10) + Math.abs(move.to.col - 0),
            Math.abs(move.to.row - 10) + Math.abs(move.to.col - 10)
          )
          return distanceToCorner < 5
        })

        if (cornerMoves.length > 0) bestMoves = cornerMoves
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)]
  }

  function makeMove(move: Move, boardState: BoardState): BoardState {
    const newBoard = boardState.map(row => [...row])
    newBoard[move.to.row][move.to.col] = move.piece
    newBoard[move.from.row][move.from.col] = null

    // Check for captures
    const captures = checkCaptures(move.to, newBoard)
    captures.forEach(capturePos => {
      newBoard[capturePos.row][capturePos.col] = null
    })

    return newBoard
  }

  function makeAiMove(boardState: BoardState, aiPlayer: 'attacker' | 'defender') {
    setIsAiThinking(true)

    setTimeout(
      () => {
        const bestMove = getBestMove(boardState, aiPlayer)
        if (bestMove) {
          const newBoard = makeMove(bestMove, boardState)
          setBoard(newBoard)
          setMoveHistory(prev => [...prev, bestMove])

          const winner = checkWinCondition(newBoard)
          if (winner) {
            setGameStatus(winner)
          } else {
            setCurrentPlayer(aiPlayer === 'attacker' ? 'defender' : 'attacker')
          }
        }
        setIsAiThinking(false)
      },
      aiLevel === 'easy' ? 500 : aiLevel === 'medium' ? 1000 : 1500
    )
  }

  function handleSquareClick(row: number, col: number) {
    if (currentPlayer !== playerRole || isAiThinking || gameStatus !== 'playing') return

    const clickedPos = { row, col }
    const piece = board[row][col]

    if (selectedSquare) {
      const isValidMoveClick = validMoves.some(move => move.row === row && move.col === col)

      if (isValidMoveClick) {
        const move: Move = {
          from: selectedSquare,
          to: clickedPos,
          piece: board[selectedSquare.row][selectedSquare.col],
        }
        const newBoard = makeMove(move, board)
        setBoard(newBoard)
        setMoveHistory(prev => [...prev, move])
        setSelectedSquare(null)
        setValidMoves([])

        const winner = checkWinCondition(newBoard)
        if (winner) {
          setGameStatus(winner)
        } else {
          const nextPlayer = currentPlayer === 'attacker' ? 'defender' : 'attacker'
          setCurrentPlayer(nextPlayer)

          // AI's turn
          if (nextPlayer !== playerRole) {
            setTimeout(() => makeAiMove(newBoard, nextPlayer), 500)
          }
        }
      } else if (piece && canPlayerMovePiece(piece, currentPlayer)) {
        setSelectedSquare(clickedPos)
        setValidMoves(getValidMoves(clickedPos, board))
      } else {
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else {
      if (piece && canPlayerMovePiece(piece, currentPlayer)) {
        setSelectedSquare(clickedPos)
        setValidMoves(getValidMoves(clickedPos, board))
      }
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
            (oppositeRow === 5 && oppositeCol === 5) ||
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

    if (!kingPos) return 'attacker_wins'
    if (isCorner(kingPos.row, kingPos.col)) return 'defender_wins'
    return null
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

  if (!gameStarted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">🤖 AI Game</h1>
          <p className="text-gray-600 mb-8">Choose your AI opponent and role!</p>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">🟢 Easy AI</h3>
                <p className="text-gray-600 mb-4">Perfect for beginners learning the game</p>
                <div className="space-y-2">
                  <button
                    onClick={() => startGame('easy', 'attacker')}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Play as Attacker
                  </button>
                  <button
                    onClick={() => startGame('easy', 'defender')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Play as Defender
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">🟡 Medium AI</h3>
                <p className="text-gray-600 mb-4">Balanced challenge for intermediate players</p>
                <div className="space-y-2">
                  <button
                    onClick={() => startGame('medium', 'attacker')}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Play as Attacker
                  </button>
                  <button
                    onClick={() => startGame('medium', 'defender')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Play as Defender
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">🔴 Hard AI</h3>
                <p className="text-gray-600 mb-4">Expert level AI for experienced players</p>
                <div className="space-y-2">
                  <button
                    onClick={() => startGame('hard', 'attacker')}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Play as Attacker
                  </button>
                  <button
                    onClick={() => startGame('hard', 'defender')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Play as Defender
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <a href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">🤖 AI Game ({aiLevel} difficulty)</h1>
          <div className="flex justify-center items-center gap-4 mb-4">
            <div
              className={`px-4 py-2 rounded ${
                currentPlayer === 'attacker' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
              }`}
            >
              {playerRole === 'attacker' ? 'You' : 'AI'} (Attacker)
              {currentPlayer === 'attacker' && !isAiThinking ? ' - Your turn' : ''}
            </div>
            <div
              className={`px-4 py-2 rounded ${
                currentPlayer === 'defender' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
              }`}
            >
              {playerRole === 'defender' ? 'You' : 'AI'} (Defender)
              {currentPlayer === 'defender' && !isAiThinking ? ' - Your turn' : ''}
            </div>
          </div>

          {isAiThinking && (
            <div className="mb-4 text-orange-600 font-semibold">🤔 AI is thinking...</div>
          )}

          {gameStatus !== 'playing' && (
            <div className="mb-4">
              <div
                className={`text-xl font-bold ${
                  gameStatus === 'attacker_wins' ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {gameStatus === 'attacker_wins'
                  ? playerRole === 'attacker'
                    ? '🎉 You Win!'
                    : '🤖 AI Wins!'
                  : playerRole === 'defender'
                    ? '🎉 You Win!'
                    : '🤖 AI Wins!'}
              </div>
              <button
                onClick={() => setGameStarted(false)}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                New Game
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
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
                        disabled={
                          gameStatus !== 'playing' || currentPlayer !== playerRole || isAiThinking
                        }
                      >
                        <span className={getPieceColor(piece)}>{getPieceSymbol(piece)}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Game Info</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>You:</strong> {playerRole === 'attacker' ? '♜ Attacker' : '♗ Defender'}
                </p>
                <p>
                  <strong>AI:</strong> {playerRole === 'attacker' ? '♗ Defender' : '♜ Attacker'}
                </p>
                <p>
                  <strong>Difficulty:</strong> {aiLevel}
                </p>
              </div>

              <h4 className="font-semibold mt-4 mb-2">Objective:</h4>
              <p className="text-sm">
                {playerRole === 'attacker'
                  ? 'Capture the king by surrounding it'
                  : 'Get the king to any corner square'}
              </p>

              {moveHistory.length > 0 && (
                <>
                  <h4 className="font-semibold mt-4 mb-2">Recent Moves:</h4>
                  <div className="max-h-32 overflow-y-auto text-sm">
                    {moveHistory.slice(-10).map((move, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{moveHistory.length - 10 + index + 1}.</span>
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
                onClick={() => setGameStarted(false)}
                className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
              >
                New Game
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
