import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Trophy,
  TrendingUp,
  Flame,
  Crown,
  Medal,
  Award,
  ArrowLeft,
  Users,
  Star,
  Swords,
  Search,
  Filter,
  Target,
  Calendar,
} from 'lucide-react'
import RatingBadge from '@/components/rating-badge'
import RatingChart from '@/components/rating-chart'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import LogoutButton from '@/components/logout-button'
import { updateSEO, seoPages } from '@/lib/seo'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface LeaderboardUser {
  rank: number
  id: string
  username: string
  displayName: string
  avatar?: string
  rating: number
  peakRating: number
  ratingClass: string
  ratingColor: string
  ratingDeviation: number
  wins: number
  losses: number
  draws: number
  totalGames: number
  winRate: number
  winStreak: number
  longestStreak: number
  lastSeen: string
  memberSince: string
  isActive: boolean
}

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [timeframe, setTimeframe] = useState('all')
  const [minRating, setMinRating] = useState('0')
  const [ratingPeriod, setRatingPeriod] = useState('30d')

  useEffect(() => {
    updateSEO({
      title: 'Valhalla Leaderboard | Viking Chess Champions Hall of Fame',
      description:
        "Witness the greatest Viking Chess warriors in Valhalla's Hall of Fame. View rankings, Norse titles, and legendary achievements.",
      keywords:
        'viking chess leaderboard, hnefatafl rankings, norse champions, hall of fame, viking warriors',
      canonical: '/leaderboard',
    })
    analytics.trackPageView('/leaderboard', 'Valhalla Leaderboard')
  }, [])

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['/api/leaderboard', { search: searchQuery, sortBy, timeframe, minRating }],
    enabled: true,
  })

  const { data: ratingHistory } = useQuery({
    queryKey: ['/api/ratings/history', { period: ratingPeriod }],
    enabled: !!currentUser,
  })

  const users = leaderboardData?.leaderboard || []
  const globalStats = leaderboardData?.globalStats
  const currentUserRank = currentUser
    ? users.find((user: LeaderboardUser) => user.id === currentUser.id)?.rank
    : 0

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-gray-500">
            #{position}
          </span>
        )
    }
  }

  const getWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws
    if (total === 0) return 0
    return Math.round((wins / total) * 100)
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'week':
        return 'This Week'
      case 'month':
        return 'This Month'
      default:
        return 'All Time'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/lobby">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-yellow-400">Valhalla Leaderboard</h1>
                <p className="text-sm text-gray-400">Hall of Fame - Greatest Vikings</p>
              </div>
            </div>

            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-300">{currentUser.displayName}</p>
                  <div className="flex items-center gap-2">
                    <RatingBadge rating={currentUser.rating} size="sm" />
                    {currentUserRank > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Rank #{currentUserRank}
                      </Badge>
                    )}
                  </div>
                </div>
                <LogoutButton size="sm" />
              </div>
            )}
          </div>

          <BreadcrumbNav />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border-white/10">
            <TabsTrigger
              value="leaderboard"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
            >
              Leaderboard
            </TabsTrigger>
            <TabsTrigger
              value="my-rating"
              className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
            >
              My Rating
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Leaderboard */}
              <div className="lg:col-span-2 space-y-6">
                {/* Filters */}
                <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search players..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="pl-10 bg-gray-800 border-gray-600"
                        />
                      </div>

                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Rating</SelectItem>
                          <SelectItem value="wins">Wins</SelectItem>
                          <SelectItem value="winRate">Win Rate</SelectItem>
                          <SelectItem value="games">Games Played</SelectItem>
                          <SelectItem value="winStreak">Win Streak</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue placeholder="Activity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Players</SelectItem>
                          <SelectItem value="7d">Active (7d)</SelectItem>
                          <SelectItem value="30d">Active (30d)</SelectItem>
                          <SelectItem value="90d">Active (90d)</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={minRating} onValueChange={setMinRating}>
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue placeholder="Min Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Ratings</SelectItem>
                          <SelectItem value="1000">1000+</SelectItem>
                          <SelectItem value="1200">1200+</SelectItem>
                          <SelectItem value="1400">1400+</SelectItem>
                          <SelectItem value="1600">1600+</SelectItem>
                          <SelectItem value="1800">1800+</SelectItem>
                          <SelectItem value="2000">2000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center text-yellow-400">
                      <Trophy className="w-5 h-5 mr-2" />
                      Champions Hall
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[...Array(15)].map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-4 p-4 bg-white/5 rounded-lg animate-pulse"
                          >
                            <div className="w-12 h-12 bg-white/10 rounded-lg" />
                            <div className="w-12 h-12 bg-white/10 rounded-full" />
                            <div className="flex-1">
                              <div className="w-32 h-5 bg-white/10 rounded mb-2" />
                              <div className="w-24 h-3 bg-white/10 rounded" />
                            </div>
                            <div className="w-24 h-8 bg-white/10 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Champions Found</h3>
                        <p>Try adjusting your search filters.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {users.map((user: LeaderboardUser) => {
                          const isCurrentUser = user.id === currentUser?.id

                          return (
                            <div
                              key={user.id}
                              className={cn(
                                'flex items-center gap-4 p-4 rounded-lg transition-all hover:bg-white/10',
                                user.rank <= 3
                                  ? 'bg-gradient-to-r from-yellow-500/15 to-transparent border border-yellow-500/30'
                                  : isCurrentUser
                                    ? 'bg-gradient-to-r from-blue-500/15 to-transparent border border-blue-500/30'
                                    : 'bg-white/5 hover:bg-white/10'
                              )}
                            >
                              <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg">
                                {getPositionIcon(user.rank)}
                              </div>

                              <Avatar className="w-12 h-12">
                                <AvatarImage src={user.avatar} alt={user.displayName} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {user.displayName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <span
                                    className={cn(
                                      'font-bold text-lg truncate',
                                      isCurrentUser ? 'text-blue-400' : 'text-white'
                                    )}
                                  >
                                    {user.displayName}
                                    {isCurrentUser && (
                                      <span className="text-sm font-normal text-blue-300 ml-2">
                                        (You)
                                      </span>
                                    )}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                    style={{
                                      backgroundColor: `${user.ratingColor}20`,
                                      color: user.ratingColor,
                                    }}
                                  >
                                    {user.ratingClass}
                                  </Badge>
                                  {user.winStreak >= 3 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded-full text-orange-400 text-xs font-semibold">
                                      <Flame className="w-3 h-3" />
                                      {user.winStreak}
                                    </div>
                                  )}
                                  {!user.isActive && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-500 border-gray-600"
                                    >
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Swords className="w-3 h-3" />
                                    {user.totalGames} games
                                  </span>
                                  <span>{user.winRate}% win rate</span>
                                  <span>
                                    {user.wins}W {user.losses}L {user.draws}D
                                  </span>
                                  {user.peakRating > user.rating && (
                                    <span className="flex items-center gap-1 text-yellow-400">
                                      <Target className="w-3 h-3" />
                                      Peak: {user.peakRating}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-2xl font-bold text-white mb-1">
                                  {user.rating}
                                </div>
                                <div className="text-xs text-gray-400">±{user.ratingDeviation}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Statistics */}
              <div className="space-y-6">
                {/* Global Statistics */}
                <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center text-yellow-400">
                      <Star className="w-5 h-5 mr-2" />
                      Global Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {globalStats && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-white/5 rounded-lg">
                            <div className="text-2xl font-bold text-white">
                              {globalStats.totalPlayers}
                            </div>
                            <div className="text-xs text-gray-400">Total Players</div>
                          </div>
                          <div className="text-center p-3 bg-white/5 rounded-lg">
                            <div className="text-2xl font-bold text-white">
                              {globalStats.averageRating}
                            </div>
                            <div className="text-xs text-gray-400">Average Rating</div>
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-lg border border-yellow-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-semibold text-yellow-400">
                              Highest Rating
                            </span>
                          </div>
                          <p className="font-bold text-white">{globalStats.highestRating}</p>
                        </div>

                        {users.length > 0 && (
                          <>
                            <div className="p-3 bg-gradient-to-r from-orange-500/20 to-transparent rounded-lg border border-orange-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <Flame className="w-4 h-4 text-orange-400" />
                                <span className="text-sm font-semibold text-orange-400">
                                  Longest Streak
                                </span>
                              </div>
                              <p className="font-bold text-white">
                                {Math.max(...users.map(u => u.longestStreak || 0))} wins
                              </p>
                              <p className="text-xs text-gray-400">
                                {
                                  users.find(
                                    u =>
                                      u.longestStreak ===
                                      Math.max(...users.map(u => u.longestStreak || 0))
                                  )?.displayName
                                }
                              </p>
                            </div>

                            <div className="p-3 bg-gradient-to-r from-green-500/20 to-transparent rounded-lg border border-green-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                <span className="text-sm font-semibold text-green-400">
                                  Best Win Rate
                                </span>
                              </div>
                              <p className="font-bold text-white">
                                {Math.max(
                                  ...users.filter(u => u.totalGames >= 5).map(u => u.winRate)
                                )}
                                %
                              </p>
                              <p className="text-xs text-gray-400">
                                {
                                  users
                                    .filter(u => u.totalGames >= 5)
                                    .find(
                                      u =>
                                        u.winRate ===
                                        Math.max(
                                          ...users
                                            .filter(u => u.totalGames >= 5)
                                            .map(u => u.winRate)
                                        )
                                    )?.displayName
                                }
                              </p>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center text-yellow-400">
                      <Swords className="w-5 h-5 mr-2" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/lobby">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                        <Users className="w-4 h-4 mr-2" />
                        Return to Lobby
                      </Button>
                    </Link>
                    <Link href="/game/create">
                      <Button
                        variant="outline"
                        className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Challenge Champions
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="my-rating" className="space-y-6">
            {currentUser ? (
              ratingHistory ? (
                <RatingChart
                  history={ratingHistory.history}
                  stats={ratingHistory.stats}
                  period={ratingPeriod}
                  onPeriodChange={setRatingPeriod}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading rating history...</p>
                </div>
              )
            ) : (
              <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                <CardContent className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Login Required</h3>
                  <p className="text-gray-400 mb-4">Please log in to view your rating history</p>
                  <Link href="/auth">
                    <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                      Login
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
