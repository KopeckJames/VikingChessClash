import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download,
  Crown,
  Shield,
  Sword,
} from 'lucide-react'

interface GameStats {
  totalGames: number
  wins: number
  losses: number
  draws: number
  winRate: number
  currentRating: number
  peakRating: number
  ratingChange: number
  averageGameTime: number
  longestWinStreak: number
  currentStreak: number
}

interface PerformanceMetrics {
  accuracy: number
  tacticalRating: number
  endgameRating: number
  openingKnowledge: number
  timeManagement: number
  blunderRate: number
  brilliantMoves: number
}

interface RecentGame {
  id: string
  opponent: string
  result: 'win' | 'loss' | 'draw'
  rating: number
  ratingChange: number
  duration: number
  role: 'attacker' | 'defender'
  date: string
}

const mockStats: GameStats = {
  totalGames: 127,
  wins: 78,
  losses: 42,
  draws: 7,
  winRate: 61.4,
  currentRating: 1456,
  peakRating: 1523,
  ratingChange: +24,
  averageGameTime: 18.5,
  longestWinStreak: 8,
  currentStreak: 3,
}

const mockMetrics: PerformanceMetrics = {
  accuracy: 87.2,
  tacticalRating: 1420,
  endgameRating: 1380,
  openingKnowledge: 72,
  timeManagement: 84,
  blunderRate: 2.1,
  brilliantMoves: 15,
}

const mockRecentGames: RecentGame[] = [
  {
    id: '1',
    opponent: 'Ragnar Iron',
    result: 'win',
    rating: 1456,
    ratingChange: +18,
    duration: 22,
    role: 'defender',
    date: '2024-01-15',
  },
  {
    id: '2',
    opponent: 'Erik Bold',
    result: 'loss',
    rating: 1438,
    ratingChange: -12,
    duration: 15,
    role: 'attacker',
    date: '2024-01-14',
  },
]

interface AnalyticsDashboardProps {
  userId?: string
  timeRange?: 'week' | 'month' | 'year' | 'all'
}

export default function AnalyticsDashboard({
  userId,
  timeRange = 'month',
}: AnalyticsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'games'>('overview')
  const [stats, setStats] = useState<GameStats>(mockStats)
  const [metrics, setMetrics] = useState<PerformanceMetrics>(mockMetrics)
  const [recentGames, setRecentGames] = useState<RecentGame[]>(mockRecentGames)

  const getResultColor = (result: RecentGame['result']) => {
    switch (result) {
      case 'win':
        return 'text-green-400'
      case 'loss':
        return 'text-red-400'
      case 'draw':
        return 'text-yellow-400'
    }
  }

  const getResultIcon = (result: RecentGame['result']) => {
    switch (result) {
      case 'win':
        return <TrendingUp className="w-4 h-4" />
      case 'loss':
        return <TrendingDown className="w-4 h-4" />
      case 'draw':
        return <Activity className="w-4 h-4" />
    }
  }

  const getRoleIcon = (role: RecentGame['role']) => {
    return role === 'attacker' ? (
      <Sword className="w-4 h-4 text-red-400" />
    ) : (
      <Shield className="w-4 h-4 text-blue-400" />
    )
  }

  const getPerformanceColor = (value: number, type: 'percentage' | 'rating' | 'rate') => {
    if (type === 'percentage') {
      if (value >= 80) return 'text-green-400'
      if (value >= 60) return 'text-yellow-400'
      return 'text-red-400'
    }
    if (type === 'rating') {
      if (value >= 1400) return 'text-green-400'
      if (value >= 1200) return 'text-yellow-400'
      return 'text-red-400'
    }
    if (type === 'rate') {
      if (value <= 2) return 'text-green-400'
      if (value <= 4) return 'text-yellow-400'
      return 'text-red-400'
    }
    return 'text-gray-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">Performance Analytics</h2>
          <p className="text-gray-400">Track your progress and improve your game</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="border-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="border-gray-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'performance', label: 'Performance', icon: Target },
          { id: 'games', label: 'Recent Games', icon: Activity },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={selectedTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setSelectedTab(tab.id as any)}
            className={cn(
              'flex-1 justify-center',
              selectedTab === tab.id
                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rating Card */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Current Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.currentRating}</div>
              <div className="flex items-center mt-1">
                {stats.ratingChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                )}
                <span className={stats.ratingChange > 0 ? 'text-green-400' : 'text-red-400'}>
                  {stats.ratingChange > 0 ? '+' : ''}
                  {stats.ratingChange}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Peak: {stats.peakRating}</div>
            </CardContent>
          </Card>

          {/* Win Rate Card */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
              <div className="text-xs text-gray-400 mt-1">
                {stats.wins}W / {stats.losses}L / {stats.draws}D
              </div>
              <div className="text-xs text-gray-400">{stats.totalGames} total games</div>
            </CardContent>
          </Card>

          {/* Average Game Time */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Avg Game Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.averageGameTime}m</div>
              <div className="text-xs text-gray-400 mt-1">Per game average</div>
            </CardContent>
          </Card>

          {/* Win Streak */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Win Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.currentStreak}</div>
              <div className="text-xs text-gray-400 mt-1">Current streak</div>
              <div className="text-xs text-gray-400">Best: {stats.longestWinStreak}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {selectedTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Accuracy */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Move Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    getPerformanceColor(metrics.accuracy, 'percentage')
                  )}
                >
                  {metrics.accuracy}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                    style={{ width: `${metrics.accuracy}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tactical Rating */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Tactical Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    getPerformanceColor(metrics.tacticalRating, 'rating')
                  )}
                >
                  {metrics.tacticalRating}
                </div>
                <div className="text-xs text-gray-400 mt-1">Puzzle solving strength</div>
              </CardContent>
            </Card>

            {/* Endgame Rating */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Endgame Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    getPerformanceColor(metrics.endgameRating, 'rating')
                  )}
                >
                  {metrics.endgameRating}
                </div>
                <div className="text-xs text-gray-400 mt-1">Late game performance</div>
              </CardContent>
            </Card>

            {/* Time Management */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Time Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    getPerformanceColor(metrics.timeManagement, 'percentage')
                  )}
                >
                  {metrics.timeManagement}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                    style={{ width: `${metrics.timeManagement}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Blunder Rate */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Blunder Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    getPerformanceColor(metrics.blunderRate, 'rate')
                  )}
                >
                  {metrics.blunderRate}%
                </div>
                <div className="text-xs text-gray-400 mt-1">Per game average</div>
              </CardContent>
            </Card>

            {/* Brilliant Moves */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Brilliant Moves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{metrics.brilliantMoves}</div>
                <div className="text-xs text-gray-400 mt-1">This month</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">Rating Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500">Rating chart will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Games Tab */}
      {selectedTab === 'games' && (
        <div className="space-y-4">
          {recentGames.map(game => (
            <Card key={game.id} className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getResultIcon(game.result)}
                      <span className={cn('font-semibold', getResultColor(game.result))}>
                        {game.result.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-white font-medium">vs {game.opponent}</div>
                    <div className="flex items-center space-x-1">
                      {getRoleIcon(game.role)}
                      <span className="text-xs text-gray-400 capitalize">{game.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-center">
                      <div className="text-white font-medium">{game.rating}</div>
                      <div
                        className={cn(
                          'text-xs',
                          game.ratingChange > 0 ? 'text-green-400' : 'text-red-400'
                        )}
                      >
                        {game.ratingChange > 0 ? '+' : ''}
                        {game.ratingChange}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">{game.duration}m</div>
                      <div className="text-xs text-gray-500">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">{game.date}</div>
                      <div className="text-xs text-gray-500">Date</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
