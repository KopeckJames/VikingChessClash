import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const achievements = [
  {
    name: 'First Victory',
    description: 'Win your first game',
    icon: '🏆',
    category: 'Beginner',
    points: 10,
    criteria: { type: 'wins', value: 1 },
  },
  {
    name: 'Warrior',
    description: 'Win 10 games',
    icon: '⚔️',
    category: 'Combat',
    points: 50,
    criteria: { type: 'wins', value: 10 },
  },
  {
    name: 'Champion',
    description: 'Win 50 games',
    icon: '👑',
    category: 'Combat',
    points: 200,
    criteria: { type: 'wins', value: 50 },
  },
  {
    name: 'Legend',
    description: 'Win 100 games',
    icon: '🌟',
    category: 'Combat',
    points: 500,
    criteria: { type: 'wins', value: 100 },
  },
  {
    name: "Attacker's Pride",
    description: 'Win 25 games as attacker',
    icon: '🗡️',
    category: 'Role',
    points: 100,
    criteria: { type: 'attacker_wins', value: 25 },
  },
  {
    name: "Defender's Honor",
    description: 'Win 25 games as defender',
    icon: '🛡️',
    category: 'Role',
    points: 100,
    criteria: { type: 'defender_wins', value: 25 },
  },
  {
    name: 'Unstoppable',
    description: 'Win 5 games in a row',
    icon: '🔥',
    category: 'Streak',
    points: 75,
    criteria: { type: 'win_streak', value: 5 },
  },
  {
    name: 'Dominator',
    description: 'Win 10 games in a row',
    icon: '💥',
    category: 'Streak',
    points: 150,
    criteria: { type: 'win_streak', value: 10 },
  },
  {
    name: 'Rising Star',
    description: 'Reach 1400 rating',
    icon: '⭐',
    category: 'Rating',
    points: 100,
    criteria: { type: 'rating', value: 1400 },
  },
  {
    name: 'Expert',
    description: 'Reach 1600 rating',
    icon: '🎯',
    category: 'Rating',
    points: 200,
    criteria: { type: 'rating', value: 1600 },
  },
  {
    name: 'Master',
    description: 'Reach 1800 rating',
    icon: '🏅',
    category: 'Rating',
    points: 300,
    criteria: { type: 'rating', value: 1800 },
  },
  {
    name: 'Grandmaster',
    description: 'Reach 2000 rating',
    icon: '💎',
    category: 'Rating',
    points: 500,
    criteria: { type: 'rating', value: 2000 },
  },
  {
    name: 'Social Butterfly',
    description: 'Add 5 friends',
    icon: '🤝',
    category: 'Social',
    points: 25,
    criteria: { type: 'friends', value: 5 },
  },
  {
    name: 'Tournament Fighter',
    description: 'Participate in your first tournament',
    icon: '🏟️',
    category: 'Tournament',
    points: 50,
    criteria: { type: 'tournaments_joined', value: 1 },
  },
  {
    name: 'Tournament Winner',
    description: 'Win a tournament',
    icon: '🏆',
    category: 'Tournament',
    points: 300,
    criteria: { type: 'tournaments_won', value: 1 },
  },
  {
    name: 'AI Slayer',
    description: 'Defeat 10 AI opponents',
    icon: '🤖',
    category: 'AI',
    points: 75,
    criteria: { type: 'ai_wins', value: 10 },
  },
  {
    name: 'Speed Demon',
    description: 'Win a game in under 5 minutes',
    icon: '⚡',
    category: 'Speed',
    points: 50,
    criteria: { type: 'fast_win', value: 300 }, // 5 minutes in seconds
  },
  {
    name: 'Endurance',
    description: 'Play a game lasting over 30 minutes',
    icon: '⏰',
    category: 'Endurance',
    points: 25,
    criteria: { type: 'long_game', value: 1800 }, // 30 minutes in seconds
  },
  {
    name: 'Comeback King',
    description: 'Win after being behind by 3+ pieces',
    icon: '🔄',
    category: 'Special',
    points: 100,
    criteria: { type: 'comeback_win', value: 1 },
  },
  {
    name: 'Perfect Game',
    description: 'Win without losing any pieces',
    icon: '✨',
    category: 'Special',
    points: 150,
    criteria: { type: 'perfect_win', value: 1 },
  },
]

export async function seedAchievements() {
  console.log('Seeding achievements...')

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement,
    })
  }

  console.log(`Seeded ${achievements.length} achievements`)
}

// Run if this file is executed directly
seedAchievements()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
