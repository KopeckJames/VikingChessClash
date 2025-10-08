import type { BoardState, PieceType, Position, Move, GameRole } from './schema'
import { isValidMove, calculateCaptures, checkWinCondition } from '../client/src/lib/game-logic'

export interface AIPersonality {
  name: string
  aggressiveness: number // 0-1, how likely to attack vs defend
  riskTolerance: number // 0-1, how willing to take risks
  kingProtection: number // 0-1, how much to prioritize king safety
  centerControl: number // 0-1, how much to value center control
}

export interface AIConfig {
  difficulty: number // 1-10
  personality: AIPersonality
  thinkingTime: number // milliseconds
  maxDepth: number // search depth
}

export interface EvaluatedMove {
  move: Move
  score: number
  depth: number
}

// Predefined AI personalities
export const AI_PERSONALITIES: Record<string, AIPersonality> = {
  aggressive: {
    name: 'Aggressive',
    aggressiveness: 0.8,
    riskTolerance: 0.7,
    kingProtection: 0.4,
    centerControl: 0.6,
  },
  defensive: {
    name: 'Defensive',
    aggressiveness: 0.3,
    riskTolerance: 0.2,
    kingProtection: 0.9,
    centerControl: 0.5,
  },
  balanced: {
    name: 'Balanced',
    aggressiveness: 0.5,
    riskTolerance: 0.5,
    kingProtection: 0.6,
    centerControl: 0.7,
  },
}

// Position evaluation weights
const POSITION_WEIGHTS = {
  KING_SAFETY: 1000,
  KING_ESCAPE_PATH: 500,
  PIECE_VALUE: 100,
  CENTER_CONTROL: 50,
  MOBILITY: 30,
  CAPTURES: 200,
  KING_DISTANCE_TO_CORNER: 300,
}

export class HnefataflAI {
  private config: AIConfig
  private transpositionTable: Map<string, { score: number; depth: number; flag: string }>
  private killerMoves: Move[][]
  private historyTable: Map<string, number>

  constructor(config: AIConfig) {
    this.config = config
    this.transpositionTable = new Map()
    this.killerMoves = Array(20)
      .fill(null)
      .map(() => [])
    this.historyTable = new Map()
  }

  /**
   * Get the best move for the AI using minimax with alpha-beta pruning
   */
  async getBestMove(board: BoardState, role: GameRole, timeLimit?: number): Promise<Move | null> {
    const startTime = Date.now()
    const maxTime = timeLimit || this.config.thinkingTime

    let bestMove: Move | null = null
    let bestScore = role === 'attacker' ? -Infinity : Infinity

    // Iterative deepening
    for (let depth = 1; depth <= this.config.maxDepth; depth++) {
      if (Date.now() - startTime > maxTime * 0.8) break

      const result = this.minimax(
        board,
        depth,
        role === 'attacker' ? -Infinity : Infinity,
        role === 'attacker' ? Infinity : -Infinity,
        role === 'attacker',
        startTime,
        maxTime
      )

      if (result && result.move) {
        bestMove = result.move
        bestScore = result.score
      }

      // If we found a winning move, no need to search deeper
      if (Math.abs(bestScore) > POSITION_WEIGHTS.KING_SAFETY / 2) {
        break
      }
    }

    return bestMove
  }

  /**
   * Minimax algorithm with alpha-beta pruning
   */
  private minimax(
    board: BoardState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    startTime: number,
    maxTime: number
  ): EvaluatedMove | null {
    // Time check
    if (Date.now() - startTime > maxTime) {
      return null
    }

    // Check for terminal states
    const winCondition = checkWinCondition(board)
    if (winCondition.winner) {
      const score =
        winCondition.winner === 'attacker'
          ? POSITION_WEIGHTS.KING_SAFETY
          : -POSITION_WEIGHTS.KING_SAFETY
      return { move: null as any, score, depth }
    }

    // Base case
    if (depth === 0) {
      const score = this.evaluatePosition(board, isMaximizing ? 'attacker' : 'defender')
      return { move: null as any, score, depth: 0 }
    }

    // Transposition table lookup
    const boardHash = this.hashBoard(board)
    const ttEntry = this.transpositionTable.get(boardHash)
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === 'exact') {
        return { move: null as any, score: ttEntry.score, depth }
      }
      if (ttEntry.flag === 'lowerbound' && ttEntry.score >= beta) {
        return { move: null as any, score: ttEntry.score, depth }
      }
      if (ttEntry.flag === 'upperbound' && ttEntry.score <= alpha) {
        return { move: null as any, score: ttEntry.score, depth }
      }
    }

    const moves = this.generateMoves(board, isMaximizing ? 'attacker' : 'defender')
    this.orderMoves(moves, depth)

    let bestMove: Move | null = null
    let bestScore = isMaximizing ? -Infinity : Infinity

    for (const move of moves) {
      const newBoard = this.makeMove(board, move)
      const result = this.minimax(
        newBoard,
        depth - 1,
        alpha,
        beta,
        !isMaximizing,
        startTime,
        maxTime
      )

      if (!result) continue // Time cutoff

      if (isMaximizing) {
        if (result.score > bestScore) {
          bestScore = result.score
          bestMove = move
        }
        alpha = Math.max(alpha, bestScore)
      } else {
        if (result.score < bestScore) {
          bestScore = result.score
          bestMove = move
        }
        beta = Math.min(beta, bestScore)
      }

      // Alpha-beta pruning
      if (beta <= alpha) {
        // Store killer move
        if (!this.killerMoves[depth].includes(move)) {
          this.killerMoves[depth].unshift(move)
          if (this.killerMoves[depth].length > 2) {
            this.killerMoves[depth].pop()
          }
        }
        break
      }
    }

    // Store in transposition table
    let flag = 'exact'
    if (bestScore <= alpha) flag = 'upperbound'
    if (bestScore >= beta) flag = 'lowerbound'

    this.transpositionTable.set(boardHash, { score: bestScore, depth, flag })

    return bestMove ? { move: bestMove, score: bestScore, depth } : null
  }

  /**
   * Evaluate the current position
   */
  private evaluatePosition(board: BoardState, perspective: GameRole): number {
    let score = 0
    const personality = this.config.personality

    // Find king position
    let kingPos: Position | null = null
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        if (board[row][col] === 'king') {
          kingPos = { row, col }
          break
        }
      }
      if (kingPos) break
    }

    if (!kingPos) {
      // King captured
      return perspective === 'attacker'
        ? POSITION_WEIGHTS.KING_SAFETY
        : -POSITION_WEIGHTS.KING_SAFETY
    }

    // Check if king escaped
    if (this.isCorner(kingPos)) {
      return perspective === 'defender'
        ? POSITION_WEIGHTS.KING_SAFETY
        : -POSITION_WEIGHTS.KING_SAFETY
    }

    // Material count
    let attackers = 0,
      defenders = 0
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const piece = board[row][col]
        if (piece === 'attacker') attackers++
        else if (piece === 'defender') defenders++
      }
    }

    // Material advantage
    const materialScore = (defenders - attackers) * POSITION_WEIGHTS.PIECE_VALUE
    score += materialScore * (perspective === 'defender' ? 1 : -1)

    // King safety evaluation
    const kingSafety = this.evaluateKingSafety(board, kingPos)
    score += kingSafety * personality.kingProtection * (perspective === 'defender' ? 1 : -1)

    // King escape potential
    const escapeScore = this.evaluateKingEscapePaths(board, kingPos)
    score += escapeScore * POSITION_WEIGHTS.KING_ESCAPE_PATH * (perspective === 'defender' ? 1 : -1)

    // Center control
    const centerScore = this.evaluateCenterControl(board)
    score += centerScore * personality.centerControl * POSITION_WEIGHTS.CENTER_CONTROL

    // Mobility
    const mobilityScore = this.evaluateMobility(board, perspective)
    score += mobilityScore * POSITION_WEIGHTS.MOBILITY

    // Adjust for difficulty
    const difficultyFactor = this.config.difficulty / 10
    score *= difficultyFactor

    // Add some randomness for lower difficulties
    if (this.config.difficulty < 8) {
      const randomFactor = (10 - this.config.difficulty) * 10
      score += (Math.random() - 0.5) * randomFactor
    }

    return score
  }

  /**
   * Evaluate king safety
   */
  private evaluateKingSafety(board: BoardState, kingPos: Position): number {
    let safety = 0
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]

    let threateningSides = 0
    let protectedSides = 0

    for (const [dr, dc] of directions) {
      const adjRow = kingPos.row + dr
      const adjCol = kingPos.col + dc

      if (adjRow < 0 || adjRow >= 11 || adjCol < 0 || adjCol >= 11) {
        // Board edge - neutral
        continue
      }

      const piece = board[adjRow][adjCol]
      if (piece === 'attacker') {
        threateningSides++
      } else if (piece === 'defender') {
        protectedSides++
      }
    }

    safety -= threateningSides * 100
    safety += protectedSides * 50

    // Bonus for being on throne
    if (kingPos.row === 5 && kingPos.col === 5) {
      safety += 200
    }

    return safety
  }

  /**
   * Evaluate king escape paths
   */
  private evaluateKingEscapePaths(board: BoardState, kingPos: Position): number {
    let escapeScore = 0
    const corners = [
      [0, 0],
      [0, 10],
      [10, 0],
      [10, 10],
    ]

    for (const [cornerRow, cornerCol] of corners) {
      const distance = Math.abs(kingPos.row - cornerRow) + Math.abs(kingPos.col - cornerCol)
      const pathClear = this.isPathToClear(board, kingPos, { row: cornerRow, col: cornerCol })

      if (pathClear) {
        escapeScore += Math.max(0, 20 - distance)
      }
    }

    return escapeScore
  }

  /**
   * Check if path to corner is relatively clear
   */
  private isPathToClear(board: BoardState, from: Position, to: Position): boolean {
    // Simplified path evaluation - check if there are major obstacles
    const rowDir = to.row > from.row ? 1 : to.row < from.row ? -1 : 0
    const colDir = to.col > from.col ? 1 : to.col < from.col ? -1 : 0

    let obstacles = 0
    let row = from.row + rowDir
    let col = from.col + colDir

    while (row !== to.row || col !== to.col) {
      if (row >= 0 && row < 11 && col >= 0 && col < 11) {
        if (board[row][col] === 'attacker') {
          obstacles++
        }
      }
      row += rowDir
      col += colDir
    }

    return obstacles <= 2 // Allow some obstacles
  }

  /**
   * Evaluate center control
   */
  private evaluateCenterControl(board: BoardState): number {
    let score = 0
    const center = { row: 5, col: 5 }

    // Check pieces near center
    for (let row = 3; row <= 7; row++) {
      for (let col = 3; col <= 7; col++) {
        const piece = board[row][col]
        const distance = Math.abs(row - center.row) + Math.abs(col - center.col)
        const weight = Math.max(0, 5 - distance)

        if (piece === 'defender' || piece === 'king') {
          score += weight
        } else if (piece === 'attacker') {
          score -= weight
        }
      }
    }

    return score
  }

  /**
   * Evaluate mobility (number of legal moves)
   */
  private evaluateMobility(board: BoardState, role: GameRole): number {
    const moves = this.generateMoves(board, role)
    const opponentMoves = this.generateMoves(board, role === 'attacker' ? 'defender' : 'attacker')

    return moves.length - opponentMoves.length
  }

  /**
   * Generate all possible moves for a role
   */
  private generateMoves(board: BoardState, role: GameRole): Move[] {
    const moves: Move[] = []

    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const piece = board[row][col]

        // Check if this piece belongs to the current role
        if (!this.isPieceOfRole(piece, role)) continue

        // Generate moves for this piece
        for (let toRow = 0; toRow < 11; toRow++) {
          for (let toCol = 0; toCol < 11; toCol++) {
            if (isValidMove(board, { row, col }, { row: toRow, col: toCol }, piece)) {
              const move: Move = {
                from: { row, col },
                to: { row: toRow, col: toCol },
                piece,
                timestamp: Date.now(),
              }

              // Calculate captures for this move
              const newBoard = this.makeMove(board, move)
              const captures = calculateCaptures(newBoard, { row: toRow, col: toCol })
              if (captures.length > 0) {
                move.captured = captures
              }

              moves.push(move)
            }
          }
        }
      }
    }

    return moves
  }

  /**
   * Check if piece belongs to role
   */
  private isPieceOfRole(piece: PieceType, role: GameRole): boolean {
    if (role === 'attacker') {
      return piece === 'attacker'
    } else {
      return piece === 'defender' || piece === 'king'
    }
  }

  /**
   * Make a move on the board (returns new board)
   */
  private makeMove(board: BoardState, move: Move): BoardState {
    const newBoard = board.map(row => [...row])

    // Move piece
    newBoard[move.to.row][move.to.col] = move.piece
    newBoard[move.from.row][move.from.col] = null

    // Apply captures
    if (move.captured) {
      for (const capturePos of move.captured) {
        newBoard[capturePos.row][capturePos.col] = null
      }
    }

    return newBoard
  }

  /**
   * Order moves for better alpha-beta pruning
   */
  private orderMoves(moves: Move[], depth: number): void {
    moves.sort((a, b) => {
      let scoreA = 0,
        scoreB = 0

      // Prioritize captures
      if (a.captured && a.captured.length > 0) scoreA += 1000 * a.captured.length
      if (b.captured && b.captured.length > 0) scoreB += 1000 * b.captured.length

      // Prioritize killer moves
      if (this.killerMoves[depth].includes(a)) scoreA += 500
      if (this.killerMoves[depth].includes(b)) scoreB += 500

      // History heuristic
      const historyA = this.historyTable.get(this.moveToString(a)) || 0
      const historyB = this.historyTable.get(this.moveToString(b)) || 0
      scoreA += historyA
      scoreB += historyB

      return scoreB - scoreA
    })
  }

  /**
   * Hash board position for transposition table
   */
  private hashBoard(board: BoardState): string {
    return board.map(row => row.map(piece => (piece ? piece[0] : '0')).join('')).join('')
  }

  /**
   * Convert move to string for history table
   */
  private moveToString(move: Move): string {
    return `${move.from.row},${move.from.col}-${move.to.row},${move.to.col}`
  }

  /**
   * Check if position is a corner
   */
  private isCorner(pos: Position): boolean {
    return (
      (pos.row === 0 && pos.col === 0) ||
      (pos.row === 0 && pos.col === 10) ||
      (pos.row === 10 && pos.col === 0) ||
      (pos.row === 10 && pos.col === 10)
    )
  }
}

/**
 * Create AI configuration based on difficulty level
 */
export function createAIConfig(
  difficulty: number,
  personalityType: keyof typeof AI_PERSONALITIES = 'balanced'
): AIConfig {
  const personality = AI_PERSONALITIES[personalityType]

  return {
    difficulty: Math.max(1, Math.min(10, difficulty)),
    personality,
    thinkingTime: Math.min(5000, 500 + difficulty * 400), // 500ms to 4.5s
    maxDepth: Math.min(8, Math.max(2, Math.floor(difficulty / 2) + 1)), // 2 to 8 depth
  }
}
