import { db } from '../server/db'
import { aiOpponents } from '../shared/schema'
import { AI_PERSONALITIES } from '../shared/ai-engine'

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Check if AI opponents already exist
    const existingAI = await db.select().from(aiOpponents).limit(1)

    if (existingAI.length > 0) {
      console.log('✅ Database already seeded')
      return
    }

    // Seed AI opponents
    const defaultOpponents = [
      // Beginner AIs
      {
        name: 'Viking Novice',
        difficulty: 2,
        rating: 800,
        personality: 'balanced' as const,
        avatar: '🛡️',
        thinkingTime: 1000,
        strategy: AI_PERSONALITIES.balanced,
      },
      {
        name: 'Shield Bearer',
        difficulty: 3,
        rating: 950,
        personality: 'defensive' as const,
        avatar: '🛡️',
        thinkingTime: 1500,
        strategy: AI_PERSONALITIES.defensive,
      },

      // Intermediate AIs
      {
        name: 'Berserker',
        difficulty: 5,
        rating: 1200,
        personality: 'aggressive' as const,
        avatar: '⚔️',
        thinkingTime: 2000,
        strategy: AI_PERSONALITIES.aggressive,
      },
      {
        name: 'Tactician',
        difficulty: 6,
        rating: 1350,
        personality: 'balanced' as const,
        avatar: '🧠',
        thinkingTime: 2500,
        strategy: AI_PERSONALITIES.balanced,
      },
      {
        name: 'Guardian',
        difficulty: 6,
        rating: 1300,
        personality: 'defensive' as const,
        avatar: '🏰',
        thinkingTime: 2500,
        strategy: AI_PERSONALITIES.defensive,
      },

      // Advanced AIs
      {
        name: 'Warlord',
        difficulty: 8,
        rating: 1600,
        personality: 'aggressive' as const,
        avatar: '👑',
        thinkingTime: 3500,
        strategy: AI_PERSONALITIES.aggressive,
      },
      {
        name: 'Strategist',
        difficulty: 8,
        rating: 1650,
        personality: 'balanced' as const,
        avatar: '🎯',
        thinkingTime: 3500,
        strategy: AI_PERSONALITIES.balanced,
      },

      // Expert AIs
      {
        name: 'Grandmaster',
        difficulty: 10,
        rating: 1900,
        personality: 'balanced' as const,
        avatar: '👑',
        thinkingTime: 4500,
        strategy: AI_PERSONALITIES.balanced,
      },
      {
        name: 'Iron Fortress',
        difficulty: 9,
        rating: 1750,
        personality: 'defensive' as const,
        avatar: '🏛️',
        thinkingTime: 4000,
        strategy: AI_PERSONALITIES.defensive,
      },
      {
        name: 'Blood Eagle',
        difficulty: 9,
        rating: 1800,
        personality: 'aggressive' as const,
        avatar: '🦅',
        thinkingTime: 4000,
        strategy: AI_PERSONALITIES.aggressive,
      },
    ]

    await db.insert(aiOpponents).values(defaultOpponents)

    console.log('✅ Successfully seeded AI opponents')
    console.log(`📊 Created ${defaultOpponents.length} AI opponents`)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('🎉 Database seeding completed!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  })
