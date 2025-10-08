import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TouchButton } from '@/components/ui/touch-button'
import { queryClient, apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import {
  Trophy,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Crown,
  ArrowLeft,
  Star,
  TrendingUp,
} from 'lucide-react'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import LogoutButton from '@/components/logout-button'
import TournamentBracket from '@/components/tournament-bracket'
import TournamentRegistration from '@/components/tournament-registration'
import TournamentChat from '@/components/tournament-chat'
import { updateSEO, seoPages } from '@/lib/seo'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface Tournament {
  id: string
  name: string
  description?: string
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'SWISS'
  status: 'REGISTRATION' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  maxParticipants: number
  currentParticipants: number
  entryFee: number
  prizePool: number
  timeControl: string
  registrationEnd: string
  startDate: string
  endDate?: string
  createdAt: string
  participants: Array<{
    id: string
    username: string
    displayName: string
    rating: number
    avatar?: string
    registeredAt: string
  }>
}

export default function Tournaments() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formatFilter, setFormatFilter] = useState<string>('all')
  const [showRegistration, setShowRegistration] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [registrationMode, setRegistrationMode] = useState<'register' | 'create'>('register')

  // Check if user is authenticated
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')

  useEffect(() => {
    if (!currentUser) {
      setLocation('/auth')
    }
  }, [currentUser, setLocation])

  useEffect(() => {
    updateSEO(seoPages.tournaments)
    analytics.trackPageView('/tournaments', 'Tournaments - Viking Chess Online')
  }, [])

  if (!currentUser) {
    return null
  }

  const { data: tournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: myTournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments/my'],
  })

  const registerMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const response = await apiRequest('POST', `/api/tournaments/${tournamentId}/register`, {
        userId: currentUser.id,
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] })
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments/my'] })
      setShowRegistration(false)
      toast({
        title: 'Registration Successful',
        description: 'You have successfully registered for the tournament!',
      })
    },
    onError: () => {
      toast({
        title: 'Registration Failed',
        description: 'Failed to register for tournament. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      const response = await apiRequest('POST', '/api/tournaments/create', {
        ...tournamentData,
        organizerId: currentUser.id,
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] })
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments/my'] })
      setShowRegistration(false)
      toast({
        title: 'Tournament Created',
        description: 'Your tournament has been created successfully!',
      })
    },
    onError: () => {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create tournament. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter
    const matchesFormat = formatFilter === 'all' || tournament.format === formatFilter

    return matchesSearch && matchesStatus && matchesFormat
  })

  const formatLabels = {
    SINGLE_ELIMINATION: 'Single Elimination',
    DOUBLE_ELIMINATION: 'Double Elimination',
    ROUND_ROBIN: 'Round Robin',
    SWISS: 'Swiss System',
  }

  const statusLabels = {
    REGISTRATION: 'Registration Open',
    ACTIVE: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION':
        return 'bg-green-500/20 text-green-400'
      case 'ACTIVE':
        return 'bg-blue-500/20 text-blue-400'
      case 'COMPLETED':
        return 'bg-gray-500/20 text-gray-400'
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const handleTournamentClick = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setRegistrationMode('register')
    setShowRegistration(true)
  }

  const handleCreateTournament = () => {
    setSelectedTournament(null)
    setRegistrationMode('create')
    setShowRegistration(true)
  }

  const renderTournamentCard = (tournament: Tournament) => {
    const registrationEndsAt = new Date(tournament.registrationEnd)
    const startsAt = new Date(tournament.startDate)
    const isRegistrationOpen = tournament.status === 'REGISTRATION'
    const isFull = tournament.currentParticipants >= tournament.maxParticipants

    return (
      <Card
        key={tournament.id}
        className="bg-white/5 backdrop-blur-lg border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
        onClick={() => handleTournamentClick(tournament)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white text-lg mb-2">{tournament.name}</CardTitle>
              {tournament.description && (
                <p className="text-gray-400 text-sm line-clamp-2">{tournament.description}</p>
              )}
            </div>
            <Badge className={cn('ml-2', getStatusColor(tournament.status))}>
              {statusLabels[tournament.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">
                {tournament.currentParticipants}/{tournament.maxParticipants} players
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">{formatLabels[tournament.format]}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">{tournament.timeControl}</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">{tournament.prizePool} prize</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {isRegistrationOpen && (
              <div className="flex justify-between text-gray-400">
                <span>Registration ends:</span>
                <span>{registrationEndsAt.toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>Starts:</span>
              <span>{startsAt.toLocaleDateString()}</span>
            </div>
          </div>

          {isRegistrationOpen && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex-1 bg-gray-700 rounded-full h-2 mr-3">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(tournament.currentParticipants / tournament.maxParticipants) * 100}%`,
                  }}
                />
              </div>
              {isFull ? (
                <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                  Full
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  Open
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
              <h1 className="text-xl font-bold text-yellow-400">Tournaments</h1>
              <p className="text-sm text-gray-400">Compete in organized competitions</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <TouchButton
              onClick={handleCreateTournament}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Tournament
            </TouchButton>
            <LogoutButton
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <BreadcrumbNav />

          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border-white/10">
              <TabsTrigger
                value="browse"
                className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
              >
                Browse Tournaments
              </TabsTrigger>
              <TabsTrigger
                value="my-tournaments"
                className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
              >
                My Tournaments
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
              >
                Tournament Rankings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-6">
              {/* Filters */}
              <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search tournaments..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-600"
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="REGISTRATION">Registration Open</SelectItem>
                        <SelectItem value="ACTIVE">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={formatFilter} onValueChange={setFormatFilter}>
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue placeholder="Filter by format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Formats</SelectItem>
                        <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                        <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                        <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                        <SelectItem value="SWISS">Swiss System</SelectItem>
                      </SelectContent>
                    </Select>

                    <TouchButton
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('')
                        setStatusFilter('all')
                        setFormatFilter('all')
                      }}
                      className="border-gray-600"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Clear Filters
                    </TouchButton>
                  </div>
                </CardContent>
              </Card>

              {/* Tournament Grid */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading tournaments...</p>
                </div>
              ) : filteredTournaments.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No tournaments found</p>
                  <TouchButton
                    onClick={handleCreateTournament}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900"
                  >
                    Create the First Tournament
                  </TouchButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTournaments.map(renderTournamentCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-tournaments" className="space-y-6">
              {myTournaments.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">You haven't joined any tournaments yet</p>
                  <TouchButton
                    onClick={() => document.querySelector('[value="browse"]')?.click()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    Browse Tournaments
                  </TouchButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myTournaments.map(renderTournamentCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2" />
                    Tournament Champions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-400">
                    <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Tournament rankings coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Tournament Registration/Creation Modal */}
      <TournamentRegistration
        tournament={selectedTournament}
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onRegister={tournamentId => registerMutation.mutate(tournamentId)}
        onCreateTournament={data => createTournamentMutation.mutate(data)}
        isRegistering={registerMutation.isPending}
        isCreating={createTournamentMutation.isPending}
        mode={registrationMode}
      />
    </div>
  )
}
