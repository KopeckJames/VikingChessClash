// Norse-themed Elo Rating System for Viking Chess

export interface RatingResult {
  newRating: number;
  ratingChange: number;
  newRank: NorseRank;
}

export interface NorseRank {
  name: string;
  title: string;
  minRating: number;
  maxRating: number;
  color: string;
  description: string;
}

export const NORSE_RANKS: NorseRank[] = [
  {
    name: "Thrall",
    title: "Bondsman",
    minRating: 0,
    maxRating: 799,
    color: "text-gray-400",
    description: "New to the ways of Hnefatafl"
  },
  {
    name: "Karl",
    title: "Freeman",
    minRating: 800,
    maxRating: 1099,
    color: "text-amber-600",
    description: "Learning the ancient strategies"
  },
  {
    name: "Warrior",
    title: "Battle-tested",
    minRating: 1100,
    maxRating: 1399,
    color: "text-blue-500",
    description: "Proven in combat and cunning"
  },
  {
    name: "Jarl",
    title: "Noble",
    minRating: 1400,
    maxRating: 1699,
    color: "text-purple-500",
    description: "Leader of warriors and tactician"
  },
  {
    name: "Skald",
    title: "Master",
    minRating: 1700,
    maxRating: 1999,
    color: "text-emerald-500",
    description: "Keeper of ancient wisdom"
  },
  {
    name: "Konungr",
    title: "King",
    minRating: 2000,
    maxRating: 3000,
    color: "text-yellow-400",
    description: "Ruler of the board and battlefield"
  }
];

export function getRankByRating(rating: number): NorseRank {
  return NORSE_RANKS.find(rank => 
    rating >= rank.minRating && rating <= rank.maxRating
  ) || NORSE_RANKS[0];
}

export function getKFactor(gamesPlayed: number, rating: number): number {
  if (gamesPlayed < 30) return 40; // New players learn faster
  if (gamesPlayed < 100) return 25; // Intermediate players
  if (rating >= 2000) return 15; // Masters have more stable ratings
  return 20; // Standard players
}

export function calculateEloRating(
  playerRating: number,
  opponentRating: number,
  gameResult: 'win' | 'loss' | 'draw',
  playerRole: 'attacker' | 'defender',
  gamesPlayed: number,
  timeControl: string,
  moveCount: number = 50
): RatingResult {
  // Expected score calculation
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  // Actual score
  let actualScore: number;
  switch (gameResult) {
    case 'win':
      actualScore = 1;
      break;
    case 'loss':
      actualScore = 0;
      break;
    case 'draw':
      actualScore = 0.5;
      break;
  }
  
  // Base K-factor
  let kFactor = getKFactor(gamesPlayed, playerRating);
  
  // Role-based adjustments (defenders typically have slight disadvantage)
  if (playerRole === 'defender' && gameResult === 'win') {
    kFactor *= 1.1; // Slight bonus for defender wins
  }
  
  // Time control modifiers
  if (timeControl.includes('blitz') || timeControl.includes('5+')) {
    kFactor *= 0.8; // Reduced impact for fast games
  }
  
  // Early resignation penalty
  if (gameResult === 'loss' && moveCount < 10) {
    kFactor *= 1.3; // Increased penalty for early resignation
  }
  
  // Calculate rating change
  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  const newRating = Math.max(500, Math.min(3000, playerRating + ratingChange));
  
  const newRank = getRankByRating(newRating);
  
  return {
    newRating,
    ratingChange,
    newRank
  };
}

export function calculateWinProbability(playerRating: number, opponentRating: number): number {
  return Math.round((1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))) * 100);
}

export function formatRatingChange(change: number): string {
  if (change > 0) return `+${change}`;
  return change.toString();
}

export function getRankProgress(rating: number): { 
  current: NorseRank; 
  next: NorseRank | null; 
  progress: number 
} {
  const current = getRankByRating(rating);
  const currentIndex = NORSE_RANKS.findIndex(rank => rank.name === current.name);
  const next = currentIndex < NORSE_RANKS.length - 1 ? NORSE_RANKS[currentIndex + 1] : null;
  
  let progress = 0;
  if (next) {
    const rangeSize = current.maxRating - current.minRating;
    const currentProgress = rating - current.minRating;
    progress = Math.round((currentProgress / rangeSize) * 100);
  } else {
    // Max rank, show progress within that rank
    const rangeSize = current.maxRating - current.minRating;
    const currentProgress = rating - current.minRating;
    progress = Math.min(100, Math.round((currentProgress / rangeSize) * 100));
  }
  
  return { current, next, progress };
}