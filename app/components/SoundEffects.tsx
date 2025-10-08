'use client'

import { useEffect, useRef } from 'react'

interface SoundEffectsProps {
  gameStatus: 'playing' | 'attacker_wins' | 'defender_wins'
  lastMove: any
  isAIThinking: boolean
}

export default function SoundEffects({ gameStatus, lastMove, isAIThinking }: SoundEffectsProps) {
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    // Initialize Web Audio API
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!audioContextRef.current) return

    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)

    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
    oscillator.type = type

    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)

    oscillator.start(audioContextRef.current.currentTime)
    oscillator.stop(audioContextRef.current.currentTime + duration)
  }

  const playMoveSound = () => {
    // Wood piece placement sound
    playTone(200, 0.1, 'square')
    setTimeout(() => playTone(150, 0.05, 'square'), 50)
  }

  const playCaptureSound = () => {
    // Battle clash sound
    playTone(100, 0.2, 'sawtooth')
    setTimeout(() => playTone(80, 0.1, 'sawtooth'), 100)
  }

  const playVictorySound = (isAttacker: boolean) => {
    if (isAttacker) {
      // Dark, ominous victory
      playTone(80, 0.5, 'sawtooth')
      setTimeout(() => playTone(60, 0.3, 'sawtooth'), 200)
      setTimeout(() => playTone(40, 0.4, 'sawtooth'), 400)
    } else {
      // Triumphant, heroic victory
      playTone(440, 0.3, 'sine')
      setTimeout(() => playTone(554, 0.3, 'sine'), 150)
      setTimeout(() => playTone(659, 0.5, 'sine'), 300)
    }
  }

  const playAIThinkingSound = () => {
    // Subtle thinking ambience
    playTone(220, 0.1, 'triangle')
    setTimeout(() => playTone(330, 0.1, 'triangle'), 500)
  }

  // Sound effect triggers
  useEffect(() => {
    if (lastMove) {
      playMoveSound()
      // Add haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }, [lastMove])

  useEffect(() => {
    if (gameStatus === 'attacker_wins') {
      playVictorySound(true)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400])
      }
    } else if (gameStatus === 'defender_wins') {
      playVictorySound(false)
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 100, 50, 300])
      }
    }
  }, [gameStatus])

  useEffect(() => {
    if (isAIThinking) {
      const interval = setInterval(playAIThinkingSound, 2000)
      return () => clearInterval(interval)
    }
  }, [isAIThinking])

  return null // This component only handles sound effects
}
