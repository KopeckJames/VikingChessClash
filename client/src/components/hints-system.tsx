import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Lightbulb,
  Eye,
  EyeOff,
  Target,
  Crown,
  Shield,
  Sword,
  AlertTriangle,
  CheckCircle,
  X,
  Zap,
  TrendingUp,
  Clock,
  Settings,
} from 'lucide-react'
import type { BoardState, Position, PieceType } from '@shared/schema'

interface Hint {
  id: string
  type: 'move' | 'tactical' | 'strategic' | 'warning' | 'opportunity'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  squares?: Position[]
  suggestedMove?: { from: Position; to: Position }
  reasoning?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface HintSettings {
  enabled: boolean
  showDuringGame: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all'
  types: {
    move: boolean
    tactical: boolean
    strategic: boolean
    warning: boolean
    opportunity: boolean
  }
  autoShow: boolean
  showReasons: boolean
}

const defaultSettings: HintSettings = {
  enabled: true,
  showDuringGame: true,
  difficulty: 'all',
  types: {
    move: true,
    tactical: true,
    strategic: true,
    warning: true,
    opportunity: true,
  },
  autoShow: false,
  showReasons: true,
}

interface HintsSystemProps {
  boardState?: BoardState
  currentPlayer?: 'attacker' | 'defender'
  userRole?: 'attacker' | 'defender'
  gamePhase?: 'opening' | 'middlegame' | 'endgame'
  isPlayerTurn?: boolean
  onHintApplied?: (hint: Hint) => void
  settings?: Partial<HintSettings>
}

export default function HintsSystem({
  boardState,
  currentPlayer,
  userRole,
  gamePhase = 'middlegame',
  isPlayerTurn = false,
  onHintApplied,
  settings: userSettings,
}: HintsSystemProps) {
  const [settings, setSettings] = useState<HintSettings>({ ...defaultSettings, ...userSettings })
  const [currentHints, setCurrentHints] = useState<Hint[]>([])
  const [selectedHint, setSelectedHint] = useState<Hint | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [hintsVisible, setHintsVisible] = useState(settings.autoShow)

  // Generate hints based on current board position
  useEffect(() => {
    if (!boardState || !settings.enabled) {
      setCurrentHints([])
      return
    }

    const hints = generateHints(boardState, currentPlayer, userRole, gamePhase)
    const filteredHints = hints.filter(hint => {
      if (settings.difficulty !== 'all' && hint.difficulty !== settings.difficulty) return false
      if (!settings.types[hint.type]) return false
      return true
    })

    setCurrentHints(filteredHints)

    if (settings.autoShow && filteredHints.length > 0) {
      setHintsVisible(true)
    }
  }, [boardState, currentPlayer, userRole, gamePhase, settings])

  const generateHints = (
    board: BoardState,
    player?: 'attacker' | 'defender',
    role?: 'attacker' | 'defender',
    phase?: 'opening' | 'middlegame' | 'endgame'
  ): Hint[] => {
    const hints: Hint[] = []

    // Find king position
    let kingPos: Position | null = null
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        if (board[row][col] === 'king') {
          kingPos = { row, col }
          break
        }
      }
      if (kingPos) break
    }

    // Generate role-specific hints
    if (role === 'defender' && kingPos) {
      // King safety hints
      if (isKingInDanger(board, kingPos)) {
        hints.push({
          id: 'king-danger',
          type: 'warning',
          priority: 'critical',
          title: 'King in Danger!',
          description:
            'Your king is under immediate threat. Consider moving to safety or blocking the attack.',
          squares: [kingPos],
          difficulty: 'beginner',
        })
      }

      // Escape opportunity hints
      const escapeRoutes = findEscapeRoutes(board, kingPos)
      if (escapeRoutes.length > 0) {
        hints.push({
          id: 'escape-opportunity',
          type: 'opportunity',
          priority: 'high',
          title: 'Escape Route Available',
          description:
            "There's a potential path to victory! Look for ways to clear the route to the corner.",
          squares: escapeRoutes,
          difficulty: 'intermediate',
        })
      }

      // Defender coordination
      if (phase === 'opening') {
        hints.push({
          id: 'defender-development',
          type: 'strategic',
          priority: 'medium',
          title: 'Develop Your Defenders',
          description: "Move your defenders to active squares to support the king's escape.",
          difficulty: 'beginner',
        })
      }
    }

    if (role === 'attacker') {
      // Encirclement hints
      if (kingPos && canImproveEncirclement(board, kingPos)) {
        hints.push({
          id: 'improve-encirclement',
          type: 'tactical',
          priority: 'high',
          title: 'Tighten the Net',
          description: "You can improve your position by reducing the king's mobility.",
          squares: [kingPos],
          difficulty: 'intermediate',
        })
      }

      // Capture opportunities
      const captureOpportunities = findCaptureOpportunities(board)
      if (captureOpportunities.length > 0) {
        hints.push({
          id: 'capture-opportunity',
          type: 'tactical',
          priority: 'high',
          title: 'Capture Available',
          description: 'You can capture an enemy piece! Look for tactical opportunities.',
          difficulty: 'beginner',
        })
      }
    }

    // General tactical hints
    if (phase === 'endgame') {
      hints.push({
        id: 'endgame-precision',
        type: 'strategic',
        priority: 'medium',
        title: 'Endgame Precision',
        description: 'In the endgame, every move counts. Calculate carefully before moving.',
        difficulty: 'advanced',
      })
    }

    return hints.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Helper functions for hint generation
  const isKingInDanger = (board: BoardState, kingPos: Position): boolean => {
    // Simplified danger detection - check if king is surrounded
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]
    let attackerCount = 0

    for (const [dr, dc] of directions) {
      const newRow = kingPos.row + dr
      const newCol = kingPos.col + dc

      if (newRow >= 0 && newRow < 11 && newCol >= 0 && newCol < 11) {
        if (board[newRow][newCol] === 'attacker') {
          attackerCount++
        }
      }
    }

    return attackerCount >= 2
  }

  const findEscapeRoutes = (board: BoardState, kingPos: Position): Position[] => {
    // Simplified - return corner squares if accessible
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 10 },
      { row: 10, col: 0 },
      { row: 10, col: 10 },
    ]

    return corners.filter(corner => {
      // Simple path check - in real implementation, would check for clear path
      return Math.abs(corner.row - kingPos.row) + Math.abs(corner.col - kingPos.col) <= 6
    })
  }

  const canImproveEncirclement = (board: BoardState, kingPos: Position): boolean => {
    // Simplified check for encirclement improvement opportunities
    return true // Placeholder
  }

  const findCaptureOpportunities = (board: BoardState): Position[] => {
    // Simplified capture detection
    return [] // Placeholder
  }

  const getHintIcon = (type: Hint['type']) => {
    switch (type) {
      case 'move':
        return <Target className="w-4 h-4" />
      case 'tactical':
        return <Zap className="w-4 h-4" />
      case 'strategic':
        return <TrendingUp className="w-4 h-4" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      case 'opportunity':
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const getHintColor = (priority: Hint['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-500/20'
      case 'high':
        return 'border-orange-500 bg-orange-500/20'
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/20'
      case 'low':
        return 'border-blue-500 bg-blue-500/20'
    }
  }

  const getPriorityColor = (priority: Hint['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400'
      case 'high':
        return 'text-orange-400'
      case 'medium':
        return 'text-yellow-400'
      case 'low':
        return 'text-blue-400'
    }
  }

  if (!settings.enabled || (!settings.showDuringGame && isPlayerTurn)) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Hints Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setHintsVisible(!hintsVisible)}
          className="text-yellow-400 hover:text-yellow-300"
        >
          {hintsVisible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {hintsVisible ? 'Hide Hints' : `Show Hints (${currentHints.length})`}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-400 hover:text-white"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-sm text-white">Hint Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Difficulty Level</label>
                <div className="flex space-x-1">
                  {['all', 'beginner', 'intermediate', 'advanced'].map(level => (
                    <Button
                      key={level}
                      variant={settings.difficulty === level ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, difficulty: level as any }))}
                      className="text-xs"
                    >
                      {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Auto Show</label>
                <Button
                  variant={settings.autoShow ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, autoShow: !prev.autoShow }))}
                  className="w-full text-xs"
                >
                  {settings.autoShow ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hints List */}
      {hintsVisible && currentHints.length > 0 && (
        <div className="space-y-2">
          {currentHints.slice(0, 3).map(hint => (
            <Card
              key={hint.id}
              className={cn(
                'cursor-pointer transition-all hover:scale-[1.02]',
                getHintColor(hint.priority),
                selectedHint?.id === hint.id && 'ring-2 ring-yellow-400'
              )}
              onClick={() => setSelectedHint(selectedHint?.id === hint.id ? null : hint)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    <div className={cn('mt-0.5', getPriorityColor(hint.priority))}>
                      {getHintIcon(hint.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-white text-sm">{hint.title}</h4>
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                          {hint.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{hint.description}</p>

                      {selectedHint?.id === hint.id && hint.reasoning && settings.showReasons && (
                        <div className="mt-2 p-2 bg-white/5 rounded text-xs text-gray-400">
                          <strong>Why:</strong> {hint.reasoning}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {hint.suggestedMove && (
                      <Button
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          onHintApplied?.(hint)
                        }}
                        className="text-xs bg-green-600 hover:bg-green-700"
                      >
                        Apply
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation()
                        setCurrentHints(prev => prev.filter(h => h.id !== hint.id))
                      }}
                      className="w-6 h-6 text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {currentHints.length > 3 && (
            <Button
              variant="ghost"
              className="w-full text-xs text-gray-400 hover:text-white"
              onClick={() => {
                /* Show all hints */
              }}
            >
              Show {currentHints.length - 3} more hints
            </Button>
          )}
        </div>
      )}

      {/* No Hints Message */}
      {hintsVisible && currentHints.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardContent className="text-center py-6">
            <Lightbulb className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No hints available right now</p>
            <p className="text-xs text-gray-500 mt-1">
              Keep playing to get personalized suggestions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
