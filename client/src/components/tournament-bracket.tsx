import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Crown, Trophy, Users, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TournamentMatch {
  id: string
  round: number
  position: number
  player1?: {
    id: string
    username: string
    displayName: string
    rating: number
    avatar?: string
  }
  player2?: {
    id: string
    username: string
    displayName: string
    rating: number
    avatar?: string
  }
  winner?: string
  status: 'pending' | 'active' | 'completed'
  scheduledAt?: string
  completedAt?: string
}

interface TournamentBracketProps {
  matches: TournamentMatch[]
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'SWISS'
  maxRounds: number
  onMatchClick?: (match: TournamentMatch) => void
  className?: string
}

export function TournamentBracket({
  matches,
  format,
  maxRounds,
  onMatchClick,
  className,
}: TournamentBracketProps) {
  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = []
      }
      acc[match.round].push(match)
      return acc
    },
    {} as Record<number, TournamentMatch[]>
  )

  const renderPlayer = (player: TournamentMatch['player1'], isWinner: boolean) => {
    if (!player) {
      return (
        <div className="flex items-center space-x-2 p-2 rounded bg-gray-800/50 border border-gray-700">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-400 truncate">TBD</p>
          </div>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'flex items-center space-x-2 p-2 rounded border transition-colors',
          isWinner
            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
            : 'bg-gray-800/50 border-gray-700 text-gray-300'
        )}
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={player.avatar} alt={player.displayName} />
          <AvatarFallback className="text-xs">
            {player.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{player.displayName}</p>
          <p className="text-xs text-gray-400">Rating: {player.rating}</p>
        </div>
        {isWinner && <Crown className="w-4 h-4 text-yellow-400" />}
      </div>
    )
  }

  const renderMatch = (match: TournamentMatch) => {
    const isPlayer1Winner = match.winner === match.player1?.id
    const isPlayer2Winner = match.winner === match.player2?.id

    return (
      <Card
        key={match.id}
        className={cn(
          'bg-white/5 backdrop-blur-lg border-white/10 cursor-pointer hover:bg-white/10 transition-colors',
          match.status === 'active' && 'ring-2 ring-blue-500/50',
          match.status === 'completed' && 'ring-1 ring-green-500/30'
        )}
        onClick={() => onMatchClick?.(match)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant={match.status === 'active' ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                match.status === 'active' && 'bg-blue-500 text-white',
                match.status === 'completed' && 'bg-green-500 text-white',
                match.status === 'pending' && 'bg-gray-600 text-gray-300'
              )}
            >
              {match.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
              {match.status === 'active' && 'Live'}
              {match.status === 'completed' && 'Final'}
              {match.status === 'pending' && 'Scheduled'}
            </Badge>
            {match.scheduledAt && (
              <span className="text-xs text-gray-400">
                {new Date(match.scheduledAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {renderPlayer(match.player1, isPlayer1Winner)}

          <div className="flex items-center justify-center py-1">
            <div className="text-xs text-gray-500 font-medium">VS</div>
          </div>

          {renderPlayer(match.player2, isPlayer2Winner)}

          {match.status === 'completed' && match.completedAt && (
            <div className="text-xs text-gray-400 text-center pt-1">
              Completed {new Date(match.completedAt).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (format === 'ROUND_ROBIN' || format === 'SWISS') {
    // For round-robin and Swiss, show matches in a simple list grouped by round
    return (
      <div className={cn('space-y-6', className)}>
        {Object.entries(matchesByRound)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([round, roundMatches]) => (
            <div key={round}>
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Round {round}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roundMatches.map(renderMatch)}
              </div>
            </div>
          ))}
      </div>
    )
  }

  // For elimination tournaments, show bracket-style layout
  return (
    <div className={cn('space-y-6', className)}>
      <div className="overflow-x-auto">
        <div className="flex space-x-8 min-w-max pb-4">
          {Array.from({ length: maxRounds }, (_, roundIndex) => {
            const round = roundIndex + 1
            const roundMatches = matchesByRound[round] || []

            return (
              <div key={round} className="flex flex-col space-y-4 min-w-[280px]">
                <h3 className="text-lg font-semibold text-yellow-400 text-center flex items-center justify-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  {round === maxRounds ? 'Final' : `Round ${round}`}
                </h3>

                <div className="space-y-4">{roundMatches.map(renderMatch)}</div>

                {round < maxRounds && (
                  <div className="flex items-center justify-center py-8">
                    <ChevronRight className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TournamentBracket
