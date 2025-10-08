import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingDataPoint {
  date: string
  rating: number
  change: number
  gameId: string
  opponent: string
  opponentRating: number
  result: 'win' | 'loss' | 'draw'
  role: 'ATTACKER' | 'DEFENDER'
  winCondition?: string
  gameType: string
}

interface RatingStats {
  currentRating: number
  peakRating: number
  totalGames: number
  wins: number
  losses: number
  draws: number
  winRate: number
  ratingChange: number
  gamesInPeriod: number
  winsInPeriod: number
  lossesInPeriod: number
  drawsInPeriod: number
}

interface RatingChartProps {
  history: RatingDataPoint[]
  stats: RatingStats
  period: string
  onPeriodChange?: (period: string) => void
  className?: string
}

export function RatingChart({
  history,
  stats,
  period,
  onPeriodChange,
  className,
}: RatingChartProps) {
  // Format data for chart
  const chartData = history.map((point, index) => ({
    ...point,
    date: new Date(point.date).toLocaleDateString(),
    gameNumber: index + 1,
    formattedDate: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }))

  // Calculate trend
  const ratingTrend = stats.ratingChange
  const isPositiveTrend = ratingTrend > 0
  const isNeutralTrend = ratingTrend === 0

  // Get rating class info
  const getRatingClass = (rating: number) => {
    const classes = [
      { title: 'Novice Viking', color: '#8B4513', minRating: 0 },
      { title: 'Warrior', color: '#CD853F', minRating: 1000 },
      { title: 'Berserker', color: '#4682B4', minRating: 1200 },
      { title: 'Jarl', color: '#9370DB', minRating: 1400 },
      { title: 'Chieftain', color: '#FF6347', minRating: 1600 },
      { title: 'Warlord', color: '#FF4500', minRating: 1800 },
      { title: 'King', color: '#FFD700', minRating: 2000 },
      { title: 'High King', color: '#FF1493', minRating: 2200 },
      { title: 'Legend', color: '#00CED1', minRating: 2400 },
      { title: 'Mythic', color: '#9400D3', minRating: 2600 },
    ]

    return classes.reverse().find(cls => rating >= cls.minRating) || classes[classes.length - 1]
  }

  const currentClass = getRatingClass(stats.currentRating)
  const peakClass = getRatingClass(stats.peakRating)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.formattedDate}</p>
          <p className="text-yellow-400">
            Rating: <span className="font-bold">{data.rating}</span>
          </p>
          <p
            className={cn(
              'text-sm',
              data.change > 0
                ? 'text-green-400'
                : data.change < 0
                  ? 'text-red-400'
                  : 'text-gray-400'
            )}
          >
            Change: {data.change > 0 ? '+' : ''}
            {data.change}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-600">
            <p className="text-sm text-gray-300">
              vs {data.opponent} ({data.opponentRating})
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  data.result === 'win' && 'bg-green-500/20 text-green-400',
                  data.result === 'loss' && 'bg-red-500/20 text-red-400',
                  data.result === 'draw' && 'bg-gray-500/20 text-gray-400'
                )}
              >
                {data.result.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {data.role}
              </Badge>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-yellow-400" />
            Rating History
          </h3>
          <p className="text-gray-400 text-sm">Track your rating progression over time</p>
        </div>

        {onPeriodChange && (
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-sm text-gray-400">Current</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.currentRating}</div>
            <div className="text-xs" style={{ color: currentClass.color }}>
              {currentClass.title}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-purple-400 mr-2" />
              <span className="text-sm text-gray-400">Peak</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.peakRating}</div>
            <div className="text-xs" style={{ color: peakClass.color }}>
              {peakClass.title}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              {isPositiveTrend ? (
                <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
              ) : isNeutralTrend ? (
                <Minus className="w-5 h-5 text-gray-400 mr-2" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
              )}
              <span className="text-sm text-gray-400">Change</span>
            </div>
            <div
              className={cn(
                'text-2xl font-bold',
                isPositiveTrend
                  ? 'text-green-400'
                  : isNeutralTrend
                    ? 'text-gray-400'
                    : 'text-red-400'
              )}
            >
              {ratingTrend > 0 ? '+' : ''}
              {ratingTrend}
            </div>
            <div className="text-xs text-gray-400">This period</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-sm text-gray-400">Games</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.gamesInPeriod}</div>
            <div className="text-xs text-gray-400">
              {stats.winsInPeriod}W-{stats.lossesInPeriod}L-{stats.drawsInPeriod}D
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Chart */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Rating Progression</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rating history available for this period</p>
              <p className="text-sm mt-2">Play some ranked games to see your progression!</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="formattedDate" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} domain={['dataMin - 50', 'dataMax + 50']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rating"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    fill="url(#ratingGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Games */}
      {chartData.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {chartData
                .slice(-10)
                .reverse()
                .map((game, index) => (
                  <div
                    key={game.gameId}
                    className="flex items-center justify-between p-3 rounded bg-white/5"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          game.result === 'win' && 'bg-green-500/20 text-green-400',
                          game.result === 'loss' && 'bg-red-500/20 text-red-400',
                          game.result === 'draw' && 'bg-gray-500/20 text-gray-400'
                        )}
                      >
                        {game.result.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="text-white text-sm font-medium">vs {game.opponent}</p>
                        <p className="text-gray-400 text-xs">
                          {game.role} • {game.gameType} • {game.formattedDate}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{game.rating}</p>
                      <p
                        className={cn(
                          'text-xs',
                          game.change > 0
                            ? 'text-green-400'
                            : game.change < 0
                              ? 'text-red-400'
                              : 'text-gray-400'
                        )}
                      >
                        {game.change > 0 ? '+' : ''}
                        {game.change}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RatingChart
