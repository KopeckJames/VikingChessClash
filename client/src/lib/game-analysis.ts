import type { BoardState, Position, PieceType, Move } from '@shared/schema'

export interface MoveEvaluation {
  move: Move
  score: number
  evaluation: 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'
  reasoning: string
  alternatives?: Move[]
  tacticalThemes?: TacticalTheme[]
}

export interface TacticalTheme {
  type:
    | 'pin'
    | 'fork'
    | 'skewer'
    | 'discovery'
    | 'sacrifice'
    | 'breakthrough'
    | 'encirclement'
    | 'escape'
  description: string
  squares: Position[]
  severity: 'low' | 'medium' | 'high'
}

export interface GameAnalysis {
  moves: MoveEvaluation[]
  accuracy: {
    white: number // Defender accuracy
    black: number // Attacker accuracy
  }
  blunders: MoveEvaluation[]
  brilliantMoves: MoveEvaluation[]
  tacticalOpportunities: TacticalTheme[]
  gamePhases: {
    opening: { start: number; end: number }
    middlegame: { start: number; end: number }
    endgame: { start: number; end: number }
  }
  keyMoments: {
    moveNumber: number
    description: string
    evaluation: number
    impact: 'game-changing' | 'significant' | 'minor'
  }[]
}

export interface PositionEvaluation {
  score: number // Positive favors defenders, negative favors attackers
  phase: 'opening' | 'middlegame' | 'endgame'
  kingSafety: number
  mobility: number
  control: number
  material: number
  threats: TacticalTheme[]
}

export class GameAnalysisEngine {
  private pieceValues = {
    king: 1000,
    defender: 30,
    attacker: 30,
  }

  /**
   * Analyze a complete game
   */
  analyzeGame(moves: Move[], initialBoard: BoardState): GameAnalysis {
    const moveEvaluations: MoveEvaluation[] = []
    let currentBoard = this.cloneBoard(initialBoard)
    let gamePhase: 'opening' | 'middlegame' | 'endgame' = 'opening'

    const blunders: MoveEvaluation[] = []
    const brilliantMoves: MoveEvaluation[] = []
    const keyMoments: GameAnalysis['keyMoments'] = []

    let previousEval = this.evaluatePosition(currentBoard)

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      const isDefenderMove = i % 2 === 0 // Assuming defenders move first

      // Update game phase
      gamePhase = this.determineGamePhase(currentBoard, i)

      // Get all legal moves for comparison
      const legalMoves = this.generateLegalMoves(
        currentBoard,
        isDefenderMove ? 'defender' : 'attacker'
      )

      // Evaluate the move
      const moveEval = this.evaluateMove(move, currentBoard, legalMoves, gamePhase)
      moveEvaluations.push(moveEval)

      // Apply the move
      currentBoard = this.applyMove(currentBoard, move)

      // Check for significant evaluation changes
      const currentEval = this.evaluatePosition(currentBoard)
      const evalDiff = Math.abs(currentEval.score - previousEval.score)

      if (evalDiff > 100) {
        keyMoments.push({
          moveNumber: i + 1,
          description: this.describeKeyMoment(move, evalDiff, currentEval),
          evaluation: currentEval.score,
          impact: evalDiff > 300 ? 'game-changing' : evalDiff > 200 ? 'significant' : 'minor',
        })
      }

      // Categorize exceptional moves
      if (moveEval.evaluation === 'blunder') {
        blunders.push(moveEval)
      } else if (moveEval.evaluation === 'brilliant') {
        brilliantMoves.push(moveEval)
      }

      previousEval = currentEval
    }

    // Calculate accuracy
    const defenderMoves = moveEvaluations.filter((_, i) => i % 2 === 0)
    const attackerMoves = moveEvaluations.filter((_, i) => i % 2 === 1)

    const defenderAccuracy = this.calculateAccuracy(defenderMoves)
    const attackerAccuracy = this.calculateAccuracy(attackerMoves)

    return {
      moves: moveEvaluations,
      accuracy: {
        white: defenderAccuracy,
        black: attackerAccuracy,
      },
      blunders,
      brilliantMoves,
      tacticalOpportunities: this.findTacticalOpportunities(currentBoard),
      gamePhases: this.identifyGamePhases(moves.length),
      keyMoments,
    }
  }

  /**
   * Evaluate a single position
   */
  evaluatePosition(board: BoardState): PositionEvaluation {
    const kingPos = this.findKing(board)
    if (!kingPos) {
      return {
        score: -1000, // King captured
        phase: 'endgame',
        kingSafety: 0,
        mobility: 0,
        control: 0,
        material: 0,
        threats: [],
      }
    }

    // Check for immediate win conditions
    if (this.isKingEscaped(kingPos)) {
      return {
        score: 1000, // Defenders win
        phase: 'endgame',
        kingSafety: 100,
        mobility: 100,
        control: 100,
        material: 100,
        threats: [],
      }
    }

    const material = this.evaluateMaterial(board)
    const kingSafety = this.evaluateKingSafety(board, kingPos)
    const mobility = this.evaluateMobility(board)
    const control = this.evaluateControl(board)
    const threats = this.findTacticalThemes(board)

    const phase = this.determineGamePhase(board, 0)

    // Combine evaluations with phase-specific weights
    let score = material * 0.3 + kingSafety * 0.4 + mobility * 0.2 + control * 0.1

    // Adjust for threats
    const threatPenalty = threats.reduce((sum, threat) => {
      const penalty = threat.severity === 'high' ? 50 : threat.severity === 'medium' ? 25 : 10
      return sum + (threat.type.includes('attack') ? -penalty : penalty)
    }, 0)

    score += threatPenalty

    return {
      score: Math.round(score),
      phase,
      kingSafety,
      mobility,
      control,
      material,
      threats,
    }
  }

  /**
   * Evaluate a specific move
   */
  private evaluateMove(
    move: Move,
    board: BoardState,
    legalMoves: Move[],
    phase: 'opening' | 'middlegame' | 'endgame'
  ): MoveEvaluation {
    const beforeEval = this.evaluatePosition(board)
    const afterBoard = this.applyMove(board, move)
    const afterEval = this.evaluatePosition(afterBoard)

    const scoreDiff = afterEval.score - beforeEval.score

    // Find best alternative moves
    const alternatives = this.findBestMoves(board, legalMoves, 3)
    const bestScore =
      alternatives.length > 0
        ? this.evaluatePosition(this.applyMove(board, alternatives[0])).score
        : afterEval.score

    const accuracy = this.calculateMoveAccuracy(scoreDiff, bestScore - beforeEval.score)

    // Determine move evaluation
    let evaluation: MoveEvaluation['evaluation']
    let reasoning: string

    if (accuracy >= 95) {
      evaluation = 'brilliant'
      reasoning = 'An exceptional move that finds the best continuation'
    } else if (accuracy >= 85) {
      evaluation = 'great'
      reasoning = 'A strong move that maintains or improves the position'
    } else if (accuracy >= 70) {
      evaluation = 'good'
      reasoning = 'A solid move with no major drawbacks'
    } else if (accuracy >= 50) {
      evaluation = 'inaccuracy'
      reasoning = 'A suboptimal move that slightly worsens the position'
    } else if (accuracy >= 25) {
      evaluation = 'mistake'
      reasoning = 'A poor move that significantly worsens the position'
    } else {
      evaluation = 'blunder'
      reasoning = 'A serious error that dramatically changes the evaluation'
    }

    // Detect tactical themes
    const tacticalThemes = this.analyzeMoveForTactics(move, board, afterBoard)

    return {
      move,
      score: afterEval.score,
      evaluation,
      reasoning,
      alternatives: alternatives.slice(0, 2),
      tacticalThemes,
    }
  }

  /**
   * Find tactical patterns in the position
   */
  private findTacticalThemes(board: BoardState): TacticalTheme[] {
    const themes: TacticalTheme[] = []
    const kingPos = this.findKing(board)

    if (!kingPos) return themes

    // Check for encirclement patterns
    const encirclementTheme = this.detectEncirclement(board, kingPos)
    if (encirclementTheme) themes.push(encirclementTheme)

    // Check for escape opportunities
    const escapeTheme = this.detectEscapeOpportunity(board, kingPos)
    if (escapeTheme) themes.push(escapeTheme)

    // Check for tactical captures
    const captureThemes = this.detectCaptureOpportunities(board)
    themes.push(...captureThemes)

    // Check for breakthrough opportunities
    const breakthroughTheme = this.detectBreakthrough(board, kingPos)
    if (breakthroughTheme) themes.push(breakthroughTheme)

    return themes
  }

  /**
   * Helper methods for position evaluation
   */
  private evaluateMaterial(board: BoardState): number {
    let score = 0

    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const piece = board[row][col]
        if (piece) {
          const value = this.pieceValues[piece]
          score += piece === 'attacker' ? -value : value
        }
      }
    }

    return score
  }

  private evaluateKingSafety(board: BoardState, kingPos: Position): number {
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]
    let safety = 100
    let attackerCount = 0
    let defenderCount = 0

    // Check adjacent squares
    for (const [dr, dc] of directions) {
      const newRow = kingPos.row + dr
      const newCol = kingPos.col + dc

      if (newRow >= 0 && newRow < 11 && newCol >= 0 && newCol < 11) {
        const piece = board[newRow][newCol]
        if (piece === 'attacker') attackerCount++
        if (piece === 'defender') defenderCount++
      }
    }

    // Penalize for nearby attackers
    safety -= attackerCount * 20

    // Bonus for nearby defenders
    safety += defenderCount * 10

    // Distance to corners (escape squares)
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 10 },
      { row: 10, col: 0 },
      { row: 10, col: 10 },
    ]

    const minDistanceToCorner = Math.min(
      ...corners.map(
        corner => Math.abs(corner.row - kingPos.row) + Math.abs(corner.col - kingPos.col)
      )
    )

    safety += Math.max(0, 20 - minDistanceToCorner * 2)

    return Math.max(0, Math.min(100, safety))
  }

  private evaluateMobility(board: BoardState): number {
    let defenderMobility = 0
    let attackerMobility = 0

    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const piece = board[row][col]
        if (piece) {
          const moves = this.getPieceMobility(board, { row, col }, piece)
          if (piece === 'attacker') {
            attackerMobility += moves
          } else {
            defenderMobility += moves
          }
        }
      }
    }

    return defenderMobility - attackerMobility
  }

  private evaluateControl(board: BoardState): number {
    // Evaluate control of key squares (center, escape routes)
    let control = 0

    // Center control
    const centerSquares = [
      { row: 4, col: 5 },
      { row: 5, col: 4 },
      { row: 5, col: 6 },
      { row: 6, col: 5 },
    ]

    for (const square of centerSquares) {
      const piece = board[square.row][square.col]
      if (piece === 'defender' || piece === 'king') control += 5
      if (piece === 'attacker') control -= 5
    }

    return control
  }

  /**
   * Tactical pattern detection methods
   */
  private detectEncirclement(board: BoardState, kingPos: Position): TacticalTheme | null {
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]
    let attackerCount = 0
    const attackerSquares: Position[] = []

    for (const [dr, dc] of directions) {
      const newRow = kingPos.row + dr
      const newCol = kingPos.col + dc

      if (newRow >= 0 && newRow < 11 && newCol >= 0 && newCol < 11) {
        if (board[newRow][newCol] === 'attacker') {
          attackerCount++
          attackerSquares.push({ row: newRow, col: newCol })
        }
      }
    }

    if (attackerCount >= 2) {
      return {
        type: 'encirclement',
        description: `King is being encircled by ${attackerCount} attackers`,
        squares: [kingPos, ...attackerSquares],
        severity: attackerCount >= 3 ? 'high' : 'medium',
      }
    }

    return null
  }

  private detectEscapeOpportunity(board: BoardState, kingPos: Position): TacticalTheme | null {
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 10 },
      { row: 10, col: 0 },
      { row: 10, col: 10 },
    ]

    for (const corner of corners) {
      if (this.hasEscapeRoute(board, kingPos, corner)) {
        return {
          type: 'escape',
          description: 'King has a potential escape route to the corner',
          squares: [kingPos, corner],
          severity: 'high',
        }
      }
    }

    return null
  }

  private detectCaptureOpportunities(board: BoardState): TacticalTheme[] {
    const themes: TacticalTheme[] = []

    // Check for pieces that can be captured
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const piece = board[row][col]
        if (piece && piece !== 'king') {
          const captureSquares = this.findCaptureThreats(board, { row, col })
          if (captureSquares.length > 0) {
            themes.push({
              type: 'fork',
              description: `${piece} can be captured`,
              squares: [{ row, col }, ...captureSquares],
              severity: 'medium',
            })
          }
        }
      }
    }

    return themes
  }

  private detectBreakthrough(board: BoardState, kingPos: Position): TacticalTheme | null {
    // Check if defenders can sacrifice pieces to create escape routes
    const defenderPositions: Position[] = []

    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        if (board[row][col] === 'defender') {
          defenderPositions.push({ row, col })
        }
      }
    }

    // Simplified breakthrough detection
    if (defenderPositions.length >= 2) {
      return {
        type: 'breakthrough',
        description: 'Potential breakthrough sacrifice available',
        squares: [kingPos, ...defenderPositions.slice(0, 2)],
        severity: 'medium',
      }
    }

    return null
  }

  /**
   * Utility methods
   */
  private cloneBoard(board: BoardState): BoardState {
    return board.map(row => [...row])
  }

  private applyMove(board: BoardState, move: Move): BoardState {
    const newBoard = this.cloneBoard(board)
    const piece = newBoard[move.from.row][move.from.col]

    newBoard[move.from.row][move.from.col] = null
    newBoard[move.to.row][move.to.col] = piece

    // Handle captures (simplified)
    // In a full implementation, this would include the capture logic

    return newBoard
  }

  private findKing(board: BoardState): Position | null {
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        if (board[row][col] === 'king') {
          return { row, col }
        }
      }
    }
    return null
  }

  private isKingEscaped(kingPos: Position): boolean {
    return (
      (kingPos.row === 0 && kingPos.col === 0) ||
      (kingPos.row === 0 && kingPos.col === 10) ||
      (kingPos.row === 10 && kingPos.col === 0) ||
      (kingPos.row === 10 && kingPos.col === 10)
    )
  }

  private generateLegalMoves(board: BoardState, player: 'attacker' | 'defender'): Move[] {
    // Simplified move generation - in full implementation would generate all legal moves
    return []
  }

  private findBestMoves(board: BoardState, moves: Move[], count: number): Move[] {
    // Simplified - would evaluate all moves and return best ones
    return moves.slice(0, count)
  }

  private calculateAccuracy(moves: MoveEvaluation[]): number {
    if (moves.length === 0) return 100

    const accuracySum = moves.reduce((sum, move) => {
      const accuracy =
        move.evaluation === 'brilliant'
          ? 100
          : move.evaluation === 'great'
            ? 90
            : move.evaluation === 'good'
              ? 80
              : move.evaluation === 'inaccuracy'
                ? 60
                : move.evaluation === 'mistake'
                  ? 40
                  : 20
      return sum + accuracy
    }, 0)

    return Math.round(accuracySum / moves.length)
  }

  private calculateMoveAccuracy(actualScore: number, bestScore: number): number {
    if (bestScore === 0) return 100
    const accuracy = Math.max(
      0,
      100 - (Math.abs(actualScore - bestScore) / Math.abs(bestScore)) * 100
    )
    return Math.round(accuracy)
  }

  private determineGamePhase(
    board: BoardState,
    moveNumber: number
  ): 'opening' | 'middlegame' | 'endgame' {
    const pieceCount = this.countPieces(board)

    if (moveNumber < 10) return 'opening'
    if (pieceCount.total < 15) return 'endgame'
    return 'middlegame'
  }

  private countPieces(board: BoardState): { attackers: number; defenders: number; total: number } {
    let attackers = 0
    let defenders = 0

    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const piece = board[row][col]
        if (piece === 'attacker') attackers++
        if (piece === 'defender' || piece === 'king') defenders++
      }
    }

    return { attackers, defenders, total: attackers + defenders }
  }

  private getPieceMobility(board: BoardState, pos: Position, piece: PieceType): number {
    // Count number of legal moves for this piece
    let mobility = 0
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]

    for (const [dr, dc] of directions) {
      for (let distance = 1; distance < 11; distance++) {
        const newRow = pos.row + dr * distance
        const newCol = pos.col + dc * distance

        if (newRow < 0 || newRow >= 11 || newCol < 0 || newCol >= 11) break
        if (board[newRow][newCol] !== null) break

        mobility++
      }
    }

    return mobility
  }

  private hasEscapeRoute(board: BoardState, from: Position, to: Position): boolean {
    // Simplified path checking - would implement proper pathfinding
    return Math.abs(from.row - to.row) + Math.abs(from.col - to.col) <= 8
  }

  private findCaptureThreats(board: BoardState, pos: Position): Position[] {
    // Simplified capture threat detection
    return []
  }

  private analyzeMoveForTactics(
    move: Move,
    beforeBoard: BoardState,
    afterBoard: BoardState
  ): TacticalTheme[] {
    // Analyze the move for tactical themes
    return []
  }

  private identifyGamePhases(totalMoves: number): GameAnalysis['gamePhases'] {
    return {
      opening: { start: 1, end: Math.min(10, totalMoves) },
      middlegame: { start: 11, end: Math.max(10, totalMoves - 15) },
      endgame: { start: Math.max(11, totalMoves - 14), end: totalMoves },
    }
  }

  private findTacticalOpportunities(board: BoardState): TacticalTheme[] {
    return this.findTacticalThemes(board)
  }

  private describeKeyMoment(move: Move, evalDiff: number, currentEval: PositionEvaluation): string {
    if (evalDiff > 300) {
      return 'Game-changing move that dramatically shifts the evaluation'
    } else if (evalDiff > 200) {
      return 'Significant move that changes the position assessment'
    } else {
      return 'Important move that affects the position'
    }
  }
}
