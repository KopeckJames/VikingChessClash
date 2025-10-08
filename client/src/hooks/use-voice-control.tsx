/**
 * Voice control hook for accessibility
 * Provides voice commands for game navigation and actions
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { announceToScreenReader } from '@/lib/accessibility'

interface VoiceCommand {
  command: string
  action: () => void
  description: string
}

interface UseVoiceControlOptions {
  enabled?: boolean
  language?: string
  continuous?: boolean
}

export function useVoiceControl(commands: VoiceCommand[], options: UseVoiceControlOptions = {}) {
  const { enabled = false, language = 'en-US', continuous = true } = options

  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [lastCommand, setLastCommand] = useState<string>('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = continuous
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = language
    }
  }, [language, continuous])

  // Process voice commands
  const processCommand = useCallback(
    (transcript: string) => {
      const normalizedTranscript = transcript.toLowerCase().trim()

      // Find matching command
      const matchedCommand = commands.find(cmd =>
        normalizedTranscript.includes(cmd.command.toLowerCase())
      )

      if (matchedCommand) {
        setLastCommand(matchedCommand.command)
        announceToScreenReader(`Executing command: ${matchedCommand.description}`)
        matchedCommand.action()
      } else {
        announceToScreenReader('Command not recognized. Say "help" for available commands.')
      }
    },
    [commands]
  )

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !enabled) return

    try {
      recognitionRef.current.start()
      setIsListening(true)
      announceToScreenReader('Voice control activated. Listening for commands.')
    } catch (error) {
      console.error('Error starting voice recognition:', error)
      announceToScreenReader('Unable to start voice control.')
    }
  }, [enabled])

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return

    recognitionRef.current.stop()
    setIsListening(false)
    announceToScreenReader('Voice control deactivated.')
  }, [])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Set up event listeners
  useEffect(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript
      processCommand(transcript)
    }

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)

      if (event.error === 'not-allowed') {
        announceToScreenReader('Microphone access denied. Please enable microphone permissions.')
      } else {
        announceToScreenReader('Voice recognition error occurred.')
      }
    }

    const handleEnd = () => {
      setIsListening(false)

      // Restart if continuous mode is enabled and we're supposed to be listening
      if (continuous && enabled) {
        setTimeout(() => {
          if (recognitionRef.current && enabled) {
            startListening()
          }
        }, 100)
      }
    }

    recognition.addEventListener('result', handleResult)
    recognition.addEventListener('error', handleError)
    recognition.addEventListener('end', handleEnd)

    return () => {
      recognition.removeEventListener('result', handleResult)
      recognition.removeEventListener('error', handleError)
      recognition.removeEventListener('end', handleEnd)
    }
  }, [processCommand, continuous, enabled, startListening])

  // Auto-start if enabled
  useEffect(() => {
    if (enabled && isSupported && !isListening) {
      startListening()
    } else if (!enabled && isListening) {
      stopListening()
    }
  }, [enabled, isSupported, isListening, startListening, stopListening])

  return {
    isSupported,
    isListening,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
  }
}

// Common voice commands for the game
export const createGameVoiceCommands = (gameActions: {
  selectPiece?: (position: string) => void
  movePiece?: (from: string, to: string) => void
  showHelp?: () => void
  showMoves?: () => void
  undo?: () => void
  resign?: () => void
  navigate?: (page: string) => void
}): VoiceCommand[] => [
  {
    command: 'help',
    action: () => gameActions.showHelp?.(),
    description: 'Show available voice commands',
  },
  {
    command: 'show moves',
    action: () => gameActions.showMoves?.(),
    description: 'Show available moves for selected piece',
  },
  {
    command: 'undo',
    action: () => gameActions.undo?.(),
    description: 'Undo last move',
  },
  {
    command: 'resign',
    action: () => gameActions.resign?.(),
    description: 'Resign from current game',
  },
  {
    command: 'go home',
    action: () => gameActions.navigate?.('/'),
    description: 'Navigate to home page',
  },
  {
    command: 'go to lobby',
    action: () => gameActions.navigate?.('/lobby'),
    description: 'Navigate to game lobby',
  },
  {
    command: 'go to profile',
    action: () => gameActions.navigate?.('/profile'),
    description: 'Navigate to user profile',
  },
  {
    command: 'show leaderboard',
    action: () => gameActions.navigate?.('/leaderboard'),
    description: 'Navigate to leaderboard',
  },
]

// Voice command help component
export function VoiceCommandHelp({ commands }: { commands: VoiceCommand[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Available Voice Commands</h3>
      <div className="grid gap-2">
        {commands.map((command, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
            <code className="text-sm font-mono bg-background px-2 py-1 rounded">
              "{command.command}"
            </code>
            <span className="text-sm text-muted-foreground">{command.description}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Speak clearly and wait for the command to be processed. Commands are case-insensitive.
      </p>
    </div>
  )
}
