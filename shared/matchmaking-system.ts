/**
 * ELO-based Matchmaking System for Viking Chess
 * Provides fair and balanced matchmaking based on player ratings and preferences
 */

export interface Player {
  id: string
  rating: number
  gamesPlayed: number
  preferredRole: 'ATTACKER' | 'DEFENDER' | 'RANDOM'
  winStreak: number
  lastGameAt?: Date
  isOnline: boolean
  searchStartTime: Date
}

export interface MatchmakingPreferences {
  timeControl: string
  maxRatingDifference?: number
  preferredRole?: 'ATTACKER' | 'DEFENDER' | 'RANDOM'
  allowUnranked?: boolean
}

export interface MatchResult {
  player1: Player
  player2: Player
  player1Role: 'ATTACKER' | 'DEFENDER'
  player2Role: 'ATTACKER' | 'DEFENDER'
  ratingDifference: number
  matchQuality: number // 0-100 score indicating match quality
  estimatedGameTime: number // in minutes
}

export class MatchmakingSystem {
  private static readonly DEFAULT_RATING_RANGE = 100
  private static readonly MAX_RATING_RANGE = 400
  private static readonly RATING_EXPANSION_RATE = 50 // Rating range expansion per minute
  private static readonly MIN_GAMES_FOR_STABLE_RATING = 10

  // Role balance factors
  private static readonly ROLE_BALANCE_BONUS = 20 // Rating bonus for playing less preferred role
  private static readonly STREAK_PENALTY_THRESHOLD = 5 // Win streak threshold for harder opponents
  private static readonly STREAK_PENALTY_RATING = 50 // Additional rating for streak players

  /**
   * Find the best match for a player from a pool of candidates
   */
  static findMatch(
    player: Player,
    candidatePool: Player[],
    preferences: MatchmakingPreferences
  ): MatchResult | null {
    if (candidatePool.length === 0) {
      return null
    }

    // Calculate dynamic rating range based on wait time
    const waitTimeMinutes = (Date.now() - player.searchStartTime.getTime()) / (1000 * 60)
    const dynamicRatingRange = Math.min(
      this.DEFAULT_RATING_RANGE + waitTimeMinutes * this.RATING_EXPANSION_RATE,
      preferences.maxRatingDifference || this.MAX_RATING_RANGE
    )

    // Filter candidates based on basic criteria
    const eligibleCandidates = candidatePool.filter(candidate =>
      this.isEligibleMatch(player, candidate, preferences, dynamicRatingRange)
    )

    if (eligibleCandidates.length === 0) {
      return null
    }

    // Score and rank all eligible candidates
    const scoredCandidates = eligibleCandidates.map(candidate => ({
      candidate,
      score: this.calculateMatchScore(player, candidate, preferences),
      roles: this.determineOptimalRoles(player, candidate, preferences),
    }))

    // Sort by match quality (higher is better)
    scoredCandidates.sort((a, b) => b.score - a.score)

    const bestMatch = scoredCandidates[0]

    return {
      player1: player,
      player2: bestMatch.candidate,
      player1Role: bestMatch.roles.player1Role,
      player2Role: bestMatch.roles.player2Role,
      ratingDifference: Math.abs(player.rating - bestMatch.candidate.rating),
      matchQuality: bestMatch.score,
      estimatedGameTime: this.estimateGameTime(preferences.timeControl),
    }
  }

  /**
   * Check if two players are eligible to be matched
   */
  private static isEligibleMatch(
    player: Player,
    candidate: Player,
    preferences: MatchmakingPreferences,
    maxRatingDiff: number
  ): boolean {
    // Can't match with self
    if (player.id === candidate.id) {
      return false
    }

    // Must be online
    if (!candidate.isOnline) {
      return false
    }

    // Check rating difference
    const ratingDiff = Math.abs(player.rating - candidate.rating)
    if (ratingDiff > maxRatingDiff) {
      return false
    }

    // Check if unranked players are allowed
    if (!preferences.allowUnranked) {
      if (
        player.gamesPlayed < this.MIN_GAMES_FOR_STABLE_RATING ||
        candidate.gamesPlayed < this.MIN_GAMES_FOR_STABLE_RATING
      ) {
        return false
      }
    }

    // Avoid recent opponents (if we had that data)
    // This would require additional tracking of recent games

    return true
  }

  /**
   * Calculate match quality score (0-100)
   */
  private static calculateMatchScore(
    player: Player,
    candidate: Player,
    preferences: MatchmakingPreferences
  ): number {
    let score = 100

    // Rating difference penalty (closer ratings = higher score)
    const ratingDiff = Math.abs(player.rating - candidate.rating)
    const ratingPenalty = (ratingDiff / this.MAX_RATING_RANGE) * 40
    score -= ratingPenalty

    // Experience difference penalty
    const experienceDiff = Math.abs(player.gamesPlayed - candidate.gamesPlayed)
    const experiencePenalty = Math.min(experienceDiff / 100, 1) * 15
    score -= experiencePenalty

    // Role compatibility bonus
    const roleBonus = this.calculateRoleCompatibilityBonus(player, candidate, preferences)
    score += roleBonus

    // Win streak balancing
    const streakPenalty = this.calculateStreakPenalty(player, candidate)
    score -= streakPenalty

    // Wait time bonus (longer wait = more lenient matching)
    const waitTimeMinutes = (Date.now() - player.searchStartTime.getTime()) / (1000 * 60)
    const waitTimeBonus = Math.min(waitTimeMinutes * 2, 20)
    score += waitTimeBonus

    // Recent activity bonus (prefer recently active players)
    if (candidate.lastGameAt) {
      const hoursSinceLastGame = (Date.now() - candidate.lastGameAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastGame < 1) {
        score += 10
      } else if (hoursSinceLastGame < 24) {
        score += 5
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate role compatibility bonus
   */
  private static calculateRoleCompatibilityBonus(
    player: Player,
    candidate: Player,
    preferences: MatchmakingPreferences
  ): number {
    // If both players have complementary role preferences, give bonus
    if (
      (player.preferredRole === 'ATTACKER' && candidate.preferredRole === 'DEFENDER') ||
      (player.preferredRole === 'DEFENDER' && candidate.preferredRole === 'ATTACKER')
    ) {
      return 15
    }

    // If one prefers random and the other has a preference, small bonus
    if (
      (player.preferredRole === 'RANDOM' && candidate.preferredRole !== 'RANDOM') ||
      (player.preferredRole !== 'RANDOM' && candidate.preferredRole === 'RANDOM')
    ) {
      return 5
    }

    // If both prefer the same role or both random, no bonus
    return 0
  }

  /**
   * Calculate penalty for win streak imbalance
   */
  private static calculateStreakPenalty(player: Player, candidate: Player): number {
    const streakDiff = Math.abs(player.winStreak - candidate.winStreak)

    // If one player has a long streak and the other doesn't, apply penalty
    if (Math.max(player.winStreak, candidate.winStreak) >= this.STREAK_PENALTY_THRESHOLD) {
      return Math.min(streakDiff * 2, 15)
    }

    return 0
  }

  /**
   * Determine optimal role assignment for both players
   */
  private static determineOptimalRoles(
    player: Player,
    candidate: Player,
    preferences: MatchmakingPreferences
  ): { player1Role: 'ATTACKER' | 'DEFENDER'; player2Role: 'ATTACKER' | 'DEFENDER' } {
    // If user has a specific preference, honor it
    if (preferences.preferredRole && preferences.preferredRole !== 'RANDOM') {
      return {
        player1Role: preferences.preferredRole,
        player2Role: preferences.preferredRole === 'ATTACKER' ? 'DEFENDER' : 'ATTACKER',
      }
    }

    // If players have complementary preferences, use them
    if (player.preferredRole === 'ATTACKER' && candidate.preferredRole === 'DEFENDER') {
      return { player1Role: 'ATTACKER', player2Role: 'DEFENDER' }
    }
    if (player.preferredRole === 'DEFENDER' && candidate.preferredRole === 'ATTACKER') {
      return { player1Role: 'DEFENDER', player2Role: 'ATTACKER' }
    }

    // If one player has a preference and the other is random, honor the preference
    if (player.preferredRole !== 'RANDOM' && candidate.preferredRole === 'RANDOM') {
      return {
        player1Role: player.preferredRole,
        player2Role: player.preferredRole === 'ATTACKER' ? 'DEFENDER' : 'ATTACKER',
      }
    }
    if (candidate.preferredRole !== 'RANDOM' && player.preferredRole === 'RANDOM') {
      return {
        player1Role: candidate.preferredRole === 'ATTACKER' ? 'DEFENDER' : 'ATTACKER',
        player2Role: candidate.preferredRole,
      }
    }

    // Default: higher rated player gets defender (traditionally harder role)
    if (player.rating >= candidate.rating) {
      return { player1Role: 'DEFENDER', player2Role: 'ATTACKER' }
    } else {
      return { player1Role: 'ATTACKER', player2Role: 'DEFENDER' }
    }
  }

  /**
   * Estimate game duration based on time control
   */
  private static estimateGameTime(timeControl: string): number {
    const [baseTime, increment] = timeControl.split('+').map(t => parseInt(t))

    // Rough estimation: base time * 2 + increment * average_moves
    const averageMoves = 40
    const estimatedMinutes = baseTime * 2 + (increment * averageMoves) / 60

    return Math.round(estimatedMinutes)
  }

  /**
   * Get matchmaking statistics for a player
   */
  static getMatchmakingStats(
    player: Player,
    candidatePool: Player[],
    preferences: MatchmakingPreferences
  ): {
    totalCandidates: number
    eligibleCandidates: number
    averageRatingDifference: number
    estimatedWaitTime: number
    recommendedRatingRange: number
  } {
    const waitTimeMinutes = (Date.now() - player.searchStartTime.getTime()) / (1000 * 60)
    const dynamicRatingRange = Math.min(
      this.DEFAULT_RATING_RANGE + waitTimeMinutes * this.RATING_EXPANSION_RATE,
      preferences.maxRatingDifference || this.MAX_RATING_RANGE
    )

    const eligibleCandidates = candidatePool.filter(candidate =>
      this.isEligibleMatch(player, candidate, preferences, dynamicRatingRange)
    )

    const ratingDifferences = eligibleCandidates.map(c => Math.abs(player.rating - c.rating))
    const averageRatingDiff =
      ratingDifferences.length > 0
        ? ratingDifferences.reduce((sum, diff) => sum + diff, 0) / ratingDifferences.length
        : 0

    // Estimate wait time based on pool size and rating
    let estimatedWaitTime = 30 // Base 30 seconds
    if (eligibleCandidates.length < 5) {
      estimatedWaitTime += 60 // Add 1 minute if few candidates
    }
    if (player.rating > 1800) {
      estimatedWaitTime += 30 // High-rated players wait longer
    }

    return {
      totalCandidates: candidatePool.length,
      eligibleCandidates: eligibleCandidates.length,
      averageRatingDifference: Math.round(averageRatingDiff),
      estimatedWaitTime,
      recommendedRatingRange: dynamicRatingRange,
    }
  }

  /**
   * Create tournament brackets using seeded matchmaking
   */
  static createTournamentBrackets(
    participants: Player[],
    format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'SWISS'
  ): Array<{ player1: Player; player2: Player; round: number; position: number }> {
    const matches: Array<{ player1: Player; player2: Player; round: number; position: number }> = []

    if (format === 'ROUND_ROBIN') {
      return this.createRoundRobinMatches(participants)
    }

    if (format === 'SWISS') {
      // Swiss system requires dynamic pairing based on results
      // For now, return first round pairings
      return this.createSwissFirstRound(participants)
    }

    // Elimination tournaments
    const sortedParticipants = [...participants].sort((a, b) => b.rating - a.rating)

    // Seed players (1 vs lowest, 2 vs second-lowest, etc.)
    for (let i = 0; i < sortedParticipants.length / 2; i++) {
      const player1 = sortedParticipants[i]
      const player2 = sortedParticipants[sortedParticipants.length - 1 - i]

      matches.push({
        player1,
        player2,
        round: 1,
        position: i + 1,
      })
    }

    return matches
  }

  /**
   * Create round-robin tournament matches
   */
  private static createRoundRobinMatches(
    participants: Player[]
  ): Array<{ player1: Player; player2: Player; round: number; position: number }> {
    const matches: Array<{ player1: Player; player2: Player; round: number; position: number }> = []
    let matchPosition = 1

    for (let round = 1; round < participants.length; round++) {
      for (let i = 0; i < participants.length / 2; i++) {
        const player1Index = i
        const player2Index = participants.length - 1 - i

        if (player1Index !== player2Index) {
          matches.push({
            player1: participants[player1Index],
            player2: participants[player2Index],
            round,
            position: matchPosition++,
          })
        }
      }

      // Rotate players (except the first one)
      const temp = participants[1]
      for (let i = 1; i < participants.length - 1; i++) {
        participants[i] = participants[i + 1]
      }
      participants[participants.length - 1] = temp
    }

    return matches
  }

  /**
   * Create first round Swiss system pairings
   */
  private static createSwissFirstRound(
    participants: Player[]
  ): Array<{ player1: Player; player2: Player; round: number; position: number }> {
    const matches: Array<{ player1: Player; player2: Player; round: number; position: number }> = []
    const sortedParticipants = [...participants].sort((a, b) => b.rating - a.rating)

    // Split into two halves and pair them
    const halfSize = Math.floor(sortedParticipants.length / 2)

    for (let i = 0; i < halfSize; i++) {
      matches.push({
        player1: sortedParticipants[i],
        player2: sortedParticipants[i + halfSize],
        round: 1,
        position: i + 1,
      })
    }

    return matches
  }
}
