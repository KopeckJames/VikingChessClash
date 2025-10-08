import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create AI Opponents
  const aiOpponents = await Promise.all([
    prisma.aIOpponent.upsert({
      where: { id: 'ai-beginner' },
      update: {},
      create: {
        id: 'ai-beginner',
        name: 'Bjorn the Beginner',
        difficulty: 2,
        rating: 800,
        personality: 'Balanced',
        avatar: '/avatars/bjorn.png',
        thinkingTime: 1000,
        strategy: {
          aggression: 0.3,
          defense: 0.7,
          riskTaking: 0.2,
        },
      },
    }),
    prisma.aIOpponent.upsert({
      where: { id: 'ai-intermediate' },
      update: {},
      create: {
        id: 'ai-intermediate',
        name: 'Erik the Tactician',
        difficulty: 5,
        rating: 1200,
        personality: 'Defensive',
        avatar: '/avatars/erik.png',
        thinkingTime: 2000,
        strategy: {
          aggression: 0.4,
          defense: 0.8,
          riskTaking: 0.3,
        },
      },
    }),
    prisma.aIOpponent.upsert({
      where: { id: 'ai-advanced' },
      update: {},
      create: {
        id: 'ai-advanced',
        name: 'Ragnar the Ruthless',
        difficulty: 8,
        rating: 1600,
        personality: 'Aggressive',
        avatar: '/avatars/ragnar.png',
        thinkingTime: 3000,
        strategy: {
          aggression: 0.9,
          defense: 0.5,
          riskTaking: 0.7,
        },
      },
    }),
    prisma.aIOpponent.upsert({
      where: { id: 'ai-master' },
      update: {},
      create: {
        id: 'ai-master',
        name: 'Odin the All-Father',
        difficulty: 10,
        rating: 2000,
        personality: 'Balanced',
        avatar: '/avatars/odin.png',
        thinkingTime: 5000,
        strategy: {
          aggression: 0.7,
          defense: 0.9,
          riskTaking: 0.5,
        },
      },
    }),
  ])

  // Create Achievements
  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { name: 'First Victory' },
      update: {},
      create: {
        name: 'First Victory',
        description: 'Win your first game',
        icon: '🏆',
        category: 'Milestone',
        points: 10,
        criteria: {
          type: 'wins',
          value: 1,
        },
      },
    }),
    prisma.achievement.upsert({
      where: { name: 'King Protector' },
      update: {},
      create: {
        name: 'King Protector',
        description: 'Win 10 games as defender',
        icon: '🛡️',
        category: 'Role',
        points: 25,
        criteria: {
          type: 'role_wins',
          role: 'DEFENDER',
          value: 10,
        },
      },
    }),
    prisma.achievement.upsert({
      where: { name: 'Viking Raider' },
      update: {},
      create: {
        name: 'Viking Raider',
        description: 'Win 10 games as attacker',
        icon: '⚔️',
        category: 'Role',
        points: 25,
        criteria: {
          type: 'role_wins',
          role: 'ATTACKER',
          value: 10,
        },
      },
    }),
    prisma.achievement.upsert({
      where: { name: 'Win Streak' },
      update: {},
      create: {
        name: 'Win Streak',
        description: 'Win 5 games in a row',
        icon: '🔥',
        category: 'Performance',
        points: 50,
        criteria: {
          type: 'win_streak',
          value: 5,
        },
      },
    }),
    prisma.achievement.upsert({
      where: { name: 'Tournament Champion' },
      update: {},
      create: {
        name: 'Tournament Champion',
        description: 'Win your first tournament',
        icon: '👑',
        category: 'Tournament',
        points: 100,
        criteria: {
          type: 'tournament_wins',
          value: 1,
        },
      },
    }),
  ])

  // Create a demo user for testing
  const hashedPassword = await bcrypt.hash('demo123', 10)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demo_player',
      displayName: 'Demo Player',
      password: hashedPassword,
      emailVerified: new Date(),
      rating: 1200,
      peakRating: 1200,
      preferredRole: 'DEFENDER',
      theme: 'dark',
      language: 'en',
      notifications: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${aiOpponents.length} AI opponents`)
  console.log(`Created ${achievements.length} achievements`)
  console.log(`Created demo user: ${demoUser.username}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
