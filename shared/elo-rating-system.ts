/**
 * Advanced ELO Rating System for Viking Chess (Hnefatafl)
 * Includes role-based adjustments and comprehensive rating calculations
 */

export interface GameResult {
  winnerId: string
  loserId: string
  winnerRole: 'ATTACKER' | 'DEFENDER'
  loserRole: 'ATTACKER' | 'DEFENDER'
  winCondition: 'KING_ESCAPE' | 'KING_CAPTURED' | 'RESIGNATION' | 'TIMEOUT' | 'DRAW'
  gameType: 'RANKED' | 'CASUAL' | 'TOURNAMENT'
  timeControl: string
}

export interface PlayerRating {
  userId: string
  rating: number
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  winStreak: number
  longestStreak: number
  peakRating: number
  attackerWins: number
  defenderWins: number
  attackerLosses: number
  defenderLosses: number
}

export interface RatingChange {
  playerId: string
  oldRating: number
  newRating: number
  change: number
  reason: string
}

export class EloRatingSystem {
  // Base K-factors for different rating ranges
  private static readonly K_FACTORS = {
    BEGINNER: 32, // < 1200 rating
    INTERMEDIATE: 24, // 1200-1800 rating
    ADVANCED: 16, // 1800-2200 rating
    EXPERT: 12, // > 2200 rating
  }

  // Role-based adjustments
  private static readonly ROLE_ADJUSTMENTS = {
    ATTACKER_WIN: 1.0, // No adjustment for attacker wins (baseline)
    DEFENDER_WIN: 1.1, // 10% bonus for defender wins (historically harder)
    ATTACKER_LOSS: 1.0, // No adjustment for attacker losses
    DEFENDER_LOSS: 0.9, // 10% reduction for defender losses
  }

  // Win condition modifiers
  private static readonly WIN_CONDITION_MODIFIERS = {
    KING_ESCAPE: 1.0, // Standard win
    KING_CAPTURED: 1.0, // Standard win
    RESIGNATION: 0.95, // Slightly reduced for resignation
    TIMEOUT: 0.9, // Reduced for timeout wins
    DRAW: 0.5, // Half points for draws
  }

  // Game type multipliers
  private static readonly GAME_TYPE_MULTIPLIERS = {
    RANKED: 1.0,
    CASUAL: 0.5,
    TOURNAMENT: 1.2,
  }

  /**
   * Calculate the K-factor based on player rating and games played
   */
  private static getKFactor(rating: number, gamesPlayed: number): number {
    // New players get higher K-factor for faster rating adjustment
    if (gamesPlayed < 10) {
      return this.K_FACTORS.BEGINNER + 8
    }

    if (rating < 1200) return this.K_FACTORS.BEGINNER
    if (rating < 1800) return this.K_FACTORS.INTERMEDIATE
    if (rating < 2200) return this.K_FACTORS.ADVANCED
    return this.K_FACTORS.EXPERT
  }

  /**
   * Calculate expected score using ELO formula
   */
  private static getExpectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
  }

  /**
   * Get role-based adjustment factor
   */
  private static getRoleAdjustment(role: 'ATTACKER' | 'DEFENDER', won: boolean): number {
    if (won) {
      return role === 'ATTACKER'
        ? this.ROLE_ADJUSTMENTS.ATTACKER_WIN
        : this.ROLE_ADJUSTMENTS.DEFENDER_WIN
    } else {
      return role === 'ATTACKER'
        ? this.ROLE_ADJUSTMENTS.ATTACKER_LOSS
        : this.ROLE_ADJUSTMENTS.DEFENDER_LOSS
    }
  }

  /**
   * Calculate new ratings after a game
   */
  static calculateRatingChanges(
    winner: PlayerRating,
    loser: PlayerRating,
    gameResult: GameResult
  ): { winnerChange: RatingChange; loserChange: RatingChange } {
    const isDraw = gameResult.winCondition === 'DRAW'

    // Calculate expected scores
    const winnerExpected = this.getExpectedScore(winner.rating, loser.rating)
    const loserExpected = this.getExpectedScore(loser.rating, winner.rating)

    // Get K-factors
    const winnerK = this.getKFactor(winner.rating, winner.gamesPlayed)
    const loserK = this.getKFactor(loser.rating, loser.gamesPlayed)

    // Calculate base rating changes
    let winnerScore = isDraw ? 0.5 : 1
    let loserScore = isDraw ? 0.5 : 0

    // Apply win condition modifier
    const winConditionMod = this.WIN_CONDITION_MODIFIERS[gameResult.winCondition]

    // Apply role adjustments
    const winnerRoleAdj = this.getRoleAdjustment(gameResult.winnerRole, !isDraw)
    const loserRoleAdj = this.getRoleAdjustment(gameResult.loserRole, false)

    // Apply game type multiplier
    const gameTypeMult = this.GAME_TYPE_MULTIPLIERS[gameResult.gameType]

    // Calculate rating changes
    const winnerRawChange = winnerK * (winnerScore - winnerExpected)
    const loserRawChange = loserK * (loserScore - loserExpected)

    // Apply all modifiers
    const winnerChange = Math.round(
      winnerRawChange * winConditionMod * winnerRoleAdj * gameTypeMult
    )
    const loserChange = Math.round(loserRawChange * winConditionMod * loserRoleAdj * gameTypeMult)

    // Ensure minimum rating change for decisive games
    const minChange = isDraw ? 0 : 1
    const finalWinnerChange = Math.max(winnerChange, minChange)
    const finalLoserChange = Math.min(loserChange, -minChange)

    return {
      winnerChange: {
        playerId: winner.userId,
        oldRating: winner.rating,
        newRating: winner.rating + finalWinnerChange,
        change: finalWinnerChange,
        reason: this.generateChangeReason(
          gameResult,
          true,
          winnerRoleAdj,
          winConditionMod,
          gameTypeMult
        ),
      },
      loserChange: {
        playerId: loser.userId,
        oldRating: loser.rating,
        newRating: Math.max(100, loser.rating + finalLoserChange), // Minimum rating of 100
        change: finalLoserChange,
        reason: this.generateChangeReason(
          gameResult,
          false,
          loserRoleAdj,
          winConditionMod,
          gameTypeMult
        ),
      },
    }
  }

  /**
   * Generate human-readable reason for rating change
   */
  private static generateChangeReason(
    gameResult: GameResult,
    won: boolean,
    roleAdj: number,
    winConditionMod: number,
    gameTypeMult: number
  ): string {
    const parts: string[] = []

    if (gameResult.winCondition === 'DRAW') {
      parts.push('Draw')
    } else {
      parts.push(won ? 'Victory' : 'Defeat')
    }

    if (roleAdj !== 1.0) {
      const role = won ? gameResult.winnerRole : gameResult.loserRole
      if (roleAdj > 1.0) {
        parts.push(`+${Math.round((roleAdj - 1) * 100)}% (${role.toLowerCase()} bonus)`)
      } else {
        parts.push(`${Math.round((roleAdj - 1) * 100)}% (${role.toLowerCase()} adjustment)`)
      }
    }

    if (winConditionMod !== 1.0) {
      const condition = gameResult.winCondition.toLowerCase().replace('_', ' ')
      parts.push(`(${condition})`)
    }

    if (gameTypeMult !== 1.0) {
      parts.push(`${gameResult.gameType.toLowerCase()} game`)
    }

    return parts.join(' ')
  }

  /**
   * Calculate performance rating for a tournament
   */
  static calculatePerformanceRating(
    results: Array<{
      opponentRating: number
      score: number // 1 for win, 0.5 for draw, 0 for loss
    }>
  ): number {
    if (results.length === 0) return 0

    const totalScore = results.reduce((sum, result) => sum + result.score, 0)
    const scorePercentage = totalScore / results.length

    // Handle perfect and zero scores
    if (scorePercentage === 1.0) {
      const avgOpponentRating =
        results.reduce((sum, r) => sum + r.opponentRating, 0) / results.length
      return avgOpponentRating + 400 // Assume 400 point advantage for perfect score
    }

    if (scorePercentage === 0.0) {
      const avgOpponentRating =
        results.reduce((sum, r) => sum + r.opponentRating, 0) / results.length
      return avgOpponentRating - 400 // Assume 400 point disadvantage for zero score
    }

    // Calculate performance rating using inverse ELO formula
    const avgOpponentRating = results.reduce((sum, r) => sum + r.opponentRating, 0) / results.length
    const performanceRating =
      avgOpponentRating + 400 * Math.log10(scorePercentage / (1 - scorePercentage))

    return Math.round(performanceRating)
  }

  /**
   * Calculate rating deviation (confidence interval)
   */
  static calculateRatingDeviation(gamesPlayed: number, timeInactive: number = 0): number {
    // Base RD starts at 350 for new players
    const baseRD = 350

    // RD decreases with more games played
    const gamesFactor = Math.max(50, baseRD - gamesPlayed * 5)

    // RD increases with inactivity (days)
    const inactivityIncrease = Math.min(100, timeInactive * 0.5)

    return Math.min(350, gamesFactor + inactivityIncrease)
  }

  /**
   * Get rating class/title based on rating
   */
  static getRatingClass(rating: number): {
    title: string
    color: string
    minRating: number
    maxRating: number
  } {
    const classes = [
      { title: 'Novice Viking', color: '#8B4513', minRating: 0, maxRating: 999 },
      { title: 'Warrior', color: '#CD853F', minRating: 1000, maxRating: 1199 },
      { title: 'Berserker', color: '#4682B4', minRating: 1200, maxRating: 1399 },
      { title: 'Jarl', color: '#9370DB', minRating: 1400, maxRating: 1599 },
      { title: 'Chieftain', color: '#FF6347', minRating: 1600, maxRating: 1799 },
      { title: 'Warlord', color: '#FF4500', minRating: 1800, maxRating: 1999 },
      { title: 'King', color: '#FFD700', minRating: 2000, maxRating: 2199 },
      { title: 'High King', color: '#FF1493', minRating: 2200, maxRating: 2399 },
      { title: 'Legend', color: '#00CED1', minRating: 2400, maxRating: 2599 },
      { title: 'Mythic', color: '#9400D3', minRating: 2600, maxRating: Infinity },
    ]

    return classes.find(cls => rating >= cls.minRating && rating <= cls.maxRating) || classes[0]
  }

  /**
   * Estimate rating change for a potential game
   */
  static estimateRatingChange(
    playerRating: number,
    opponentRating: number,
    playerGamesPlayed: number,
    gameType: 'RANKED' | 'CASUAL' | 'TOURNAMENT' = 'RANKED'
  ): { winChange: number; lossChange: number; drawChange: number } {
    const kFactor = this.getKFactor(playerRating, playerGamesPlayed)
    const expected = this.getExpectedScore(playerRating, opponentRating)
    const gameTypeMult = this.GAME_TYPE_MULTIPLIERS[gameType]

    const winChange = Math.round(kFactor * (1 - expected) * gameTypeMult)
    const lossChange = Math.round(kFactor * (0 - expected) * gameTypeMult)
    const drawChange = Math.round(kFactor * (0.5 - expected) * gameTypeMult)

    return { winChange, lossChange, drawChange }
  }
}
