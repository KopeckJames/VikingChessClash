import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TouchButton } from '@/components/ui/touch-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Camera,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Settings,
  Crown,
  Sword,
  Shield,
  Star,
  Calendar,
  MapPin,
  Edit3,
  Save,
  X,
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'
import { updateSEO, seoPages } from '@/lib/seo'
import { analytics } from '@/lib/analytics'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import RatingBadge from '@/components/rating-badge'

interface UserProfile {
  id: string
  email: string
  username: string
  displayName: string
  avatar?: string
  rating: number
  peakRating: number
  wins: number
  losses: number
  draws: number
  winStreak: number
  longestStreak: number
  preferredRole: 'ATTACKER' | 'DEFENDER'
  theme: string
  language: string
  notifications: boolean
  createdAt: string
  lastSeen: string
  achievements: Achievement[]
  friends: Friend[]
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  points: number
  unlockedAt: string
}

interface Friend {
  id: string
  username: string
  displayName: string
  avatar?: string
  rating: number
  isOnline: boolean
  status: 'ACCEPTED' | 'PENDING' | 'BLOCKED'
}

export default function Profile() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const [editData, setEditData] = useState({
    displayName: '',
    preferredRole: 'DEFENDER' as const,
    theme: 'dark',
    language: 'en',
    notifications: true,
  })

  useEffect(() => {
    updateSEO(seoPages.profile)
    analytics.trackPageView('/profile', 'User Profile - Viking Chess Online')
  }, [])

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      return response.json()
    },
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] })
      setIsEditing(false)
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      })
    },
  })

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] })
      toast({
        title: 'Avatar updated',
        description: 'Your avatar has been successfully updated',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload avatar',
        variant: 'destructive',
      })
    },
  })

  useEffect(() => {
    if (profile && !isEditing) {
      setEditData({
        displayName: profile.displayName,
        preferredRole: profile.preferredRole,
        theme: profile.theme,
        language: profile.language,
        notifications: profile.notifications,
      })
    }
  }, [profile, isEditing])

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editData)
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: 'File too large',
          description: 'Avatar must be less than 5MB',
          variant: 'destructive',
        })
        return
      }
      uploadAvatarMutation.mutate(file)
    }
  }

  const getWinRate = () => {
    if (!profile) return 0
    const totalGames = profile.wins + profile.losses + profile.draws
    return totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0
  }

  const getRatingTrend = () => {
    if (!profile) return 'stable'
    if (profile.rating > profile.peakRating * 0.95) return 'up'
    if (profile.rating < profile.peakRating * 0.85) return 'down'
    return 'stable'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/80 border-slate-700">
          <CardContent className="pt-6 text-center">
            <p className="text-white">Profile not found</p>
            <TouchButton onClick={() => navigate('/lobby')} className="mt-4">
              Return to Lobby
            </TouchButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <BreadcrumbNav />

        {/* Profile Header */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar Section */}
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-32 md:h-32">
                  <AvatarImage src={profile.avatar} alt={profile.displayName} />
                  <AvatarFallback className="bg-slate-700 text-white text-2xl">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 rounded-full p-2 cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      {profile.displayName}
                    </h1>
                    <p className="text-slate-400">@{profile.username}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <RatingBadge rating={profile.rating} />
                      <Badge variant="outline" className="text-slate-300 border-slate-600">
                        {profile.preferredRole === 'ATTACKER' ? (
                          <>
                            <Sword className="w-3 h-3 mr-1" /> Attacker
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3 mr-1" /> Defender
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isEditing ? (
                      <TouchButton
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-700"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </TouchButton>
                    ) : (
                      <div className="flex gap-2">
                        <TouchButton
                          onClick={handleSaveProfile}
                          disabled={updateProfileMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </TouchButton>
                        <TouchButton
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          className="border-slate-600 text-white hover:bg-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </TouchButton>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{profile.wins}</div>
                    <div className="text-sm text-slate-400">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{profile.losses}</div>
                    <div className="text-sm text-slate-400">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{profile.draws}</div>
                    <div className="text-sm text-slate-400">Draws</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{getWinRate()}%</div>
                    <div className="text-sm text-slate-400">Win Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-800 h-12">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-slate-600">
              <Target className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="text-white data-[state=active]:bg-slate-600"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="friends" className="text-white data-[state=active]:bg-slate-600">
              <Users className="w-4 h-4 mr-2" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-slate-600">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Statistics Card */}
              <Card className="bg-slate-800/80 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Current Rating</span>
                    <span className="text-white font-bold">{profile.rating}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Peak Rating</span>
                    <span className="text-yellow-400 font-bold">{profile.peakRating}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Win Streak</span>
                    <span className="text-green-400 font-bold">{profile.winStreak}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Longest Streak</span>
                    <span className="text-blue-400 font-bold">{profile.longestStreak}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card className="bg-slate-800/80 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Member Since</span>
                    <span className="text-white">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Last Seen</span>
                    <span className="text-white">
                      {new Date(profile.lastSeen).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Games</span>
                    <span className="text-white font-bold">
                      {profile.wins + profile.losses + profile.draws}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements Preview */}
              <Card className="bg-slate-800/80 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.achievements.length > 0 ? (
                    <div className="space-y-2">
                      {profile.achievements.slice(0, 3).map(achievement => (
                        <div key={achievement.id} className="flex items-center gap-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div>
                            <div className="text-white font-medium">{achievement.name}</div>
                            <div className="text-xs text-slate-400">{achievement.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">No achievements yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="bg-slate-800/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">All Achievements</CardTitle>
                <CardDescription className="text-slate-400">
                  Unlock achievements by playing games and reaching milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profile.achievements.map(achievement => (
                      <div key={achievement.id} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{achievement.name}</h3>
                            <p className="text-sm text-slate-400 mb-2">{achievement.description}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {achievement.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-3 h-3" />
                                <span className="text-xs">{achievement.points}</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No achievements unlocked yet</p>
                    <p className="text-sm text-slate-500">
                      Start playing to earn your first achievement!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-6">
            <Card className="bg-slate-800/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Friends</CardTitle>
                <CardDescription className="text-slate-400">
                  Connect with other warriors and challenge them to battles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.friends.length > 0 ? (
                  <div className="space-y-3">
                    {profile.friends.map(friend => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={friend.avatar} alt={friend.displayName} />
                              <AvatarFallback className="bg-slate-600 text-white">
                                {friend.displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {friend.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{friend.displayName}</div>
                            <div className="text-sm text-slate-400">@{friend.username}</div>
                          </div>
                          <RatingBadge rating={friend.rating} size="sm" />
                        </div>
                        <div className="flex gap-2">
                          <TouchButton
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-600"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </TouchButton>
                          <TouchButton size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Challenge
                          </TouchButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No friends yet</p>
                    <p className="text-sm text-slate-500">
                      Add friends to challenge them and track their progress!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-800/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Profile Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Customize your profile and game preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display-name" className="text-white">
                        Display Name
                      </Label>
                      <Input
                        id="display-name"
                        value={editData.displayName}
                        onChange={e =>
                          setEditData(prev => ({ ...prev, displayName: e.target.value }))
                        }
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Preferred Role</Label>
                      <div className="flex gap-2">
                        <TouchButton
                          type="button"
                          variant={editData.preferredRole === 'ATTACKER' ? 'default' : 'outline'}
                          onClick={() =>
                            setEditData(prev => ({ ...prev, preferredRole: 'ATTACKER' }))
                          }
                          className={
                            editData.preferredRole === 'ATTACKER'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'border-slate-600 text-white hover:bg-slate-700'
                          }
                        >
                          <Sword className="w-4 h-4 mr-2" />
                          Attacker
                        </TouchButton>
                        <TouchButton
                          type="button"
                          variant={editData.preferredRole === 'DEFENDER' ? 'default' : 'outline'}
                          onClick={() =>
                            setEditData(prev => ({ ...prev, preferredRole: 'DEFENDER' }))
                          }
                          className={
                            editData.preferredRole === 'DEFENDER'
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'border-slate-600 text-white hover:bg-slate-700'
                          }
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Defender
                        </TouchButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Display Name</span>
                      <span className="text-white">{profile.displayName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Username</span>
                      <span className="text-white">@{profile.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Email</span>
                      <span className="text-white">{profile.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Preferred Role</span>
                      <Badge variant="outline" className="text-slate-300 border-slate-600">
                        {profile.preferredRole === 'ATTACKER' ? (
                          <>
                            <Sword className="w-3 h-3 mr-1" /> Attacker
                          </>
                        ) : (
                          <>
                            <Shield className="w-3 h-3 mr-1" /> Defender
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
