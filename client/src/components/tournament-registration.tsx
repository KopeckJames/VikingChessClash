import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal'
import { TouchButton } from '@/components/ui/touch-button'
import {
  Trophy,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Star,
  Crown,
  UserPlus,
  Settings,
  Info,
} from 'lucide-react'
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
  participants: Array<{
    id: string
    username: string
    displayName: string
    rating: number
    avatar?: string
    registeredAt: string
  }>
}

interface TournamentRegistrationProps {
  tournament?: Tournament
  isOpen: boolean
  onClose: () => void
  onRegister?: (tournamentId: string) => void
  onCreateTournament?: (tournamentData: any) => void
  isRegistering?: boolean
  isCreating?: boolean
  mode: 'register' | 'create'
}

export function TournamentRegistration({
  tournament,
  isOpen,
  onClose,
  onRegister,
  onCreateTournament,
  isRegistering = false,
  isCreating = false,
  mode = 'register',
}: TournamentRegistrationProps) {
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    format: 'SINGLE_ELIMINATION' as const,
    maxParticipants: 16,
    entryFee: 0,
    prizePool: 0,
    timeControl: '15+10',
    registrationEnd: '',
    startDate: '',
  })

  const formatLabels = {
    SINGLE_ELIMINATION: 'Single Elimination',
    DOUBLE_ELIMINATION: 'Double Elimination',
    ROUND_ROBIN: 'Round Robin',
    SWISS: 'Swiss System',
  }

  const handleCreateTournament = () => {
    if (!createForm.name || !createForm.registrationEnd || !createForm.startDate) {
      return
    }
    onCreateTournament?.(createForm)
  }

  const handleRegister = () => {
    if (tournament) {
      onRegister?.(tournament.id)
    }
  }

  if (mode === 'create') {
    return (
      <ResponsiveModal open={isOpen} onOpenChange={onClose}>
        <ResponsiveModalContent className="max-w-2xl bg-slate-900 border-slate-700">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle className="text-yellow-400 flex items-center">
              <Trophy className="w-6 h-6 mr-2" />
              Create Tournament
            </ResponsiveModalTitle>
            <ResponsiveModalDescription className="text-gray-400">
              Set up a new tournament for players to compete in
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Tournament Name *
                </Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter tournament name"
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format" className="text-gray-300">
                  Format
                </Label>
                <Select
                  value={createForm.format}
                  onValueChange={(value: any) =>
                    setCreateForm(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(formatLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your tournament..."
                className="bg-slate-800 border-slate-600"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxParticipants" className="text-gray-300">
                  Max Participants
                </Label>
                <Select
                  value={createForm.maxParticipants.toString()}
                  onValueChange={value =>
                    setCreateForm(prev => ({ ...prev, maxParticipants: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 16, 32, 64, 128].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} players
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryFee" className="text-gray-300">
                  Entry Fee
                </Label>
                <Input
                  id="entryFee"
                  type="number"
                  min="0"
                  value={createForm.entryFee}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, entryFee: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prizePool" className="text-gray-300">
                  Prize Pool
                </Label>
                <Input
                  id="prizePool"
                  type="number"
                  min="0"
                  value={createForm.prizePool}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, prizePool: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeControl" className="text-gray-300">
                  Time Control
                </Label>
                <Select
                  value={createForm.timeControl}
                  onValueChange={value => setCreateForm(prev => ({ ...prev, timeControl: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5+3">5+3 minutes (Blitz)</SelectItem>
                    <SelectItem value="10+5">10+5 minutes (Rapid)</SelectItem>
                    <SelectItem value="15+10">15+10 minutes (Standard)</SelectItem>
                    <SelectItem value="30+20">30+20 minutes (Classical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationEnd" className="text-gray-300">
                  Registration Ends *
                </Label>
                <Input
                  id="registrationEnd"
                  type="datetime-local"
                  value={createForm.registrationEnd}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, registrationEnd: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-gray-300">
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={createForm.startDate}
                  onChange={e => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <TouchButton
              onClick={handleCreateTournament}
              disabled={
                isCreating ||
                !createForm.name ||
                !createForm.registrationEnd ||
                !createForm.startDate
              }
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900"
            >
              {isCreating ? 'Creating...' : 'Create Tournament'}
            </TouchButton>
            <TouchButton variant="outline" onClick={onClose} className="border-gray-600">
              Cancel
            </TouchButton>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>
    )
  }

  if (!tournament) return null

  const isRegistrationOpen = tournament.status === 'REGISTRATION'
  const registrationEndsAt = new Date(tournament.registrationEnd)
  const startsAt = new Date(tournament.startDate)
  const isFull = tournament.currentParticipants >= tournament.maxParticipants

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onClose}>
      <ResponsiveModalContent className="max-w-4xl bg-slate-900 border-slate-700">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="text-yellow-400 flex items-center">
            <Trophy className="w-6 h-6 mr-2" />
            {tournament.name}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="text-gray-400">
            {tournament.description || 'Join this tournament to compete against other players'}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Tournament Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">
                  {tournament.currentParticipants}/{tournament.maxParticipants}
                </div>
                <div className="text-xs text-gray-400">Players</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Settings className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">
                  {formatLabels[tournament.format]}
                </div>
                <div className="text-xs text-gray-400">Format</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">{tournament.timeControl}</div>
                <div className="text-xs text-gray-400">Time Control</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">{tournament.prizePool}</div>
                <div className="text-xs text-gray-400">Prize Pool</div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Registration Ends:</span>
                <span className="text-white font-medium">
                  {registrationEndsAt.toLocaleDateString()} at{' '}
                  {registrationEndsAt.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tournament Starts:</span>
                <span className="text-white font-medium">
                  {startsAt.toLocaleDateString()} at {startsAt.toLocaleTimeString()}
                </span>
              </div>
              {tournament.endDate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Estimated End:</span>
                  <span className="text-white font-medium">
                    {new Date(tournament.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Participants ({tournament.currentParticipants})
                </div>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  {tournament.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                {tournament.participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center space-x-3 p-2 rounded bg-white/5"
                  >
                    <div className="flex items-center space-x-2">
                      {index < 3 && (
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            index === 0 && 'bg-yellow-500 text-yellow-900',
                            index === 1 && 'bg-gray-400 text-gray-900',
                            index === 2 && 'bg-amber-600 text-amber-100'
                          )}
                        >
                          {index + 1}
                        </div>
                      )}
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={participant.avatar} alt={participant.displayName} />
                        <AvatarFallback className="text-xs">
                          {participant.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {participant.displayName}
                      </p>
                      <p className="text-xs text-gray-400">Rating: {participant.rating}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {isRegistrationOpen && !isFull && (
            <TouchButton
              onClick={handleRegister}
              disabled={isRegistering}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isRegistering ? 'Registering...' : 'Join Tournament'}
            </TouchButton>
          )}

          {isFull && (
            <div className="flex-1 text-center py-2 text-gray-400">
              <Info className="w-4 h-4 inline mr-2" />
              Tournament is full
            </div>
          )}

          {!isRegistrationOpen && (
            <div className="flex-1 text-center py-2 text-gray-400">
              <Info className="w-4 h-4 inline mr-2" />
              Registration closed
            </div>
          )}

          <TouchButton variant="outline" onClick={onClose} className="border-gray-600">
            Close
          </TouchButton>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  )
}

export default TournamentRegistration
