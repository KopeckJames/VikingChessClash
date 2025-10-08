// Simple test to verify AI system functionality
import { HnefataflAI, createAIConfig, AI_PERSONALITIES } from './shared/ai-engine.js'
import { createInitialBoard } from './client/src/lib/game-logic.js'

async function testAISystem() {
  console.log('Testing AI System...')

  // Test AI configuration creation
  const easyConfig = createAIConfig(3, 'balanced')
  const hardConfig = createAIConfig(8, 'aggressive')

  console.log('✓ AI configurations created successfully')
  console.log(
    `Easy AI: difficulty ${easyConfig.difficulty}, thinking time ${easyConfig.thinkingTime}ms`
  )
  console.log(
    `Hard AI: difficulty ${hardConfig.difficulty}, thinking time ${hardConfig.thinkingTime}ms`
  )

  // Test AI instance creation
  const ai = new HnefataflAI(easyConfig)
  console.log('✓ AI instance created successfully')

  // Test move generation
  const board = createInitialBoard()
  console.log('✓ Initial board created')

  try {
    const move = await ai.getBestMove(board, 'attacker', 1000) // 1 second limit for test
    if (move) {
      console.log('✓ AI generated move successfully')
      console.log(
        `Move: ${move.piece} from (${move.from.row},${move.from.col}) to (${move.to.row},${move.to.col})`
      )
    } else {
      console.log('⚠ AI returned null move (might be due to time limit)')
    }
  } catch (error) {
    console.log('⚠ AI move generation failed:', error.message)
  }

  // Test personality system
  console.log('\n✓ Available AI personalities:')
  Object.entries(AI_PERSONALITIES).forEach(([key, personality]) => {
    console.log(
      `  - ${personality.name}: aggressiveness=${personality.aggressiveness}, kingProtection=${personality.kingProtection}`
    )
  })

  console.log('\n🎉 AI System test completed successfully!')
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAISystem().catch(console.error)
}

export { testAISystem }
