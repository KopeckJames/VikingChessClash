import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { Brain, Shield, Swords, Target, Crown, Clock } from 'lucide-react'
import type { AIOpponent, GameRole } from '../../../shared/schema'

interface AIOpponentSelectorProps {
  onSelectOpponent: (aiOpponent: AIOpponent, userRole: GameRole, timeControl: string) => void
  onCancel: () => void
  isLoading?: boolean
}

interface AIOpponentWithStats extends AIOpponent {
  winRate: number
}

const DIFFICULTY_COLORS = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-green-100 text-green-800',
  4: 'bg-yellow-100 text-yellow-800',
  5: 'bg-yellow-100 text-yellow-800',
  6: 'bg-orange-100 text-orange-800',
  7: 'bg-orange-100 text-orange-800',
  8: 'bg-red-100 text-red-800',
  9: 'bg-red-100 text-red-800',
  10: 'bg-purple-100 text-purple-800',
}

const DIFFICULTY_LABELS = {
  1: 'Beginner',
  2: 'Beginner',
  3: 'Easy',
  4: 'Easy',
  5: 'Medium',
  6: 'Medium',
  7: 'Hard',
  8: 'Hard',
  9: 'Expert',
  10: 'Master',
}

const PERSONALITY_ICONS = {
  aggressive: <Swords className="w-4 h-4" />,
  defensive: <Shield className="w-4 h-4" />,
  balanced: <Target className="w-4 h-4" />,
}

const TIME_CONTROLS = [
  { value: '5+3', label: '5 + 3 (Blitz)' },
  { value: '10+5', label: '10 + 5 (Rapid)' },
  { value: '15+10', label: '15 + 10 (Standard)' },
  { value: '30+15', label: '30 + 15 (Classical)' },
]

export function AIOpponentSelector({
  onSelectOpponent,
  onCancel,
  isLoading,
}: AIOpponentSelectorProps) {
  const [opponents, setOpponents] = useState<AIOpponentWithStats[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<AIOpponent | null>(null)
  const [userRole, setUserRole] = useState<GameRole>('defender')
  const [timeControl, setTimeControl] = useState('15+10')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [personalityFilter, setPersonalityFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOpponents()
  }, [])

  const fetchOpponents = async () => {
    try {
      const response = await fetch('/api/ai/opponents')
      if (response.ok) {
        const data = await response.json()
        const opponentsWithStats = data.map((opponent: AIOpponent) => ({
          ...opponent,
          winRate:
            opponent.gamesPlayed > 0 ? Math.round((opponent.wins / opponent.gamesPlayed) * 100) : 0,
        }))
        setOpponents(opponentsWithStats)
      }
    } catch (error) {
      console.error('Failed to fetch AI opponents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOpponents = opponents.filter(opponent => {
    if (difficultyFilter !== 'all') {
      const range = difficultyFilter.split('-').map(Number)
      if (range.length === 2) {
        if (opponent.difficulty < range[0] || opponent.difficulty > range[1]) {
          return false
        }
      } else if (opponent.difficulty !== parseInt(difficultyFilter)) {
        return false
      }
    }

    if (personalityFilter !== 'all' && opponent.personality !== personalityFilter) {
      return false
    }

    return true
  })

  const handleStartGame = () => {
    if (selectedOpponent) {
      onSelectOpponent(selectedOpponent, userRole, timeControl)
    }
  }

  const getDifficultyBadge = (difficulty: number) => {
    const colorClass =
      DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || 'bg-gray-100 text-gray-800'
    const label = DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS] || 'Unknown'

    return (
      <Badge className={colorClass}>
        {label} ({difficulty}/10)
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Loading AI Opponents...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Choose Your AI Opponent
        </CardTitle>
        <CardDescription>
          Select an AI opponent to play against. Each AI has different difficulty levels and playing
          styles.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <Label htmlFor="difficulty-filter">Difficulty</Label>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="1-3">Beginner (1-3)</SelectItem>
                <SelectItem value="4-6">Intermediate (4-6)</SelectItem>
                <SelectItem value="7-8">Advanced (7-8)</SelectItem>
                <SelectItem value="9-10">Expert (9-10)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-48">
            <Label htmlFor="personality-filter">Personality</Label>
            <Select value={personalityFilter} onValueChange={setPersonalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All personalities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Personalities</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
                <SelectItem value="defensive">Defensive</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* AI Opponents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredOpponents.map(opponent => (
            <Card
              key={opponent.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedOpponent?.id === opponent.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedOpponent(opponent)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{opponent.avatar}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{opponent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {PERSONALITY_ICONS[opponent.personality as keyof typeof PERSONALITY_ICONS]}
                      <span className="text-xs text-muted-foreground capitalize">
                        {opponent.personality}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {getDifficultyBadge(opponent.difficulty)}

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Rating: {opponent.rating}</span>
                    <span>Win Rate: {opponent.winRate}%</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{opponent.thinkingTime / 1000}s thinking</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Games: {opponent.gamesPlayed} | W: {opponent.wins} | L: {opponent.losses} | D:{' '}
                    {opponent.draws}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOpponents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No AI opponents match your filters.
          </div>
        )}

        <Separator />

        {/* Game Settings */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Your Role</Label>
            <RadioGroup
              value={userRole}
              onValueChange={value => setUserRole(value as GameRole)}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="defender" id="defender" />
                <Label htmlFor="defender" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Defender (Protect the King)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="attacker" id="attacker" />
                <Label htmlFor="attacker" className="flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  Attacker (Capture the King)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="time-control">Time Control</Label>
            <Select value={timeControl} onValueChange={setTimeControl}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_CONTROLS.map(control => (
                  <SelectItem key={control.value} value={control.value}>
                    {control.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            onClick={handleStartGame}
            disabled={!selectedOpponent || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Starting Game...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Start Game vs {selectedOpponent?.name}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
