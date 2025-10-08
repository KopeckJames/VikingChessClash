import React, { useState, useEffect } from 'react'
import { Bell, BellOff, Settings, Check, X, TestTube } from 'lucide-react'
import { pushNotificationService, NotificationTemplates } from '../lib/push-notifications'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Alert, AlertDescription } from './ui/alert'

interface NotificationPreferences {
  enabled: boolean
  gameMoves: boolean
  gameInvitations: boolean
  gameCompleted: boolean
  tournamentStart: boolean
  tournamentRounds: boolean
  friendsOnline: boolean
  achievements: boolean
  systemMessages: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

const defaultPreferences: NotificationPreferences = {
  enabled: false,
  gameMoves: true,
  gameInvitations: true,
  gameCompleted: true,
  tournamentStart: true,
  tournamentRounds: true,
  friendsOnline: false,
  achievements: true,
  systemMessages: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkNotificationSupport()
    loadPreferences()
  }, [])

  const checkNotificationSupport = async () => {
    const supported = pushNotificationService.isSupported()
    setIsSupported(supported)

    if (supported) {
      const currentPermission = pushNotificationService.getPermissionStatus()
      setPermission(currentPermission)

      // Check if already subscribed
      const subscription = await pushNotificationService.getSubscription()
      setIsSubscribed(!!subscription)
    }
  }

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('notification-preferences')
      if (saved) {
        const parsed = JSON.parse(saved)
        setPreferences({ ...defaultPreferences, ...parsed })
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    }
  }

  const savePreferences = (newPreferences: NotificationPreferences) => {
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(newPreferences))
      setPreferences(newPreferences)
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
    }
  }

  const handleEnableNotifications = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Initialize service worker
      const initialized = await pushNotificationService.init()
      if (!initialized) {
        throw new Error('Failed to initialize push notifications')
      }

      // Subscribe to push notifications
      const subscription = await pushNotificationService.subscribe()
      if (subscription) {
        setIsSubscribed(true)
        setPermission('granted')

        const newPreferences = { ...preferences, enabled: true }
        savePreferences(newPreferences)

        // Send test notification
        await pushNotificationService.sendTestNotification()
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
      setError(error instanceof Error ? error.message : 'Failed to enable notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await pushNotificationService.unsubscribe()
      if (success) {
        setIsSubscribed(false)

        const newPreferences = { ...preferences, enabled: false }
        savePreferences(newPreferences)
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error)
      setError(error instanceof Error ? error.message : 'Failed to disable notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.showLocalNotification(
        NotificationTemplates.gameMove('Test Opponent', 'test-game-123')
      )
    } catch (error) {
      console.error('Failed to send test notification:', error)
      setError('Failed to send test notification')
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value }
    savePreferences(newPreferences)
  }

  const updateQuietHours = (key: keyof NotificationPreferences['quietHours'], value: any) => {
    const newPreferences = {
      ...preferences,
      quietHours: { ...preferences.quietHours, [key]: value },
    }
    savePreferences(newPreferences)
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return (
          <Badge className="bg-green-500">
            <Check className="h-3 w-3 mr-1" />
            Granted
          </Badge>
        )
      case 'denied':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Denied
          </Badge>
        )
      default:
        return <Badge variant="outline">Not Requested</Badge>
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in this browser. Please use a modern browser like
              Chrome, Firefox, or Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Notification Status</p>
            <p className="text-sm text-muted-foreground">
              Permission: {getPermissionBadge()}
              {isSubscribed && <Badge className="ml-2 bg-blue-500">Subscribed</Badge>}
            </p>
          </div>

          <div className="flex gap-2">
            {preferences.enabled && isSubscribed && (
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
            )}

            <Button
              onClick={preferences.enabled ? handleDisableNotifications : handleEnableNotifications}
              disabled={isLoading}
              variant={preferences.enabled ? 'destructive' : 'default'}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : preferences.enabled ? (
                <BellOff className="h-4 w-4 mr-2" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              {preferences.enabled ? 'Disable' : 'Enable'} Notifications
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {preferences.enabled && (
          <>
            <Separator />

            {/* Game Notifications */}
            <div className="space-y-4">
              <h3 className="font-medium">Game Notifications</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="game-moves">Your Turn</Label>
                    <p className="text-sm text-muted-foreground">When it's your turn to move</p>
                  </div>
                  <Switch
                    id="game-moves"
                    checked={preferences.gameMoves}
                    onCheckedChange={checked => updatePreference('gameMoves', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="game-invitations">Game Invitations</Label>
                    <p className="text-sm text-muted-foreground">
                      When someone invites you to play
                    </p>
                  </div>
                  <Switch
                    id="game-invitations"
                    checked={preferences.gameInvitations}
                    onCheckedChange={checked => updatePreference('gameInvitations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="game-completed">Game Results</Label>
                    <p className="text-sm text-muted-foreground">When games are completed</p>
                  </div>
                  <Switch
                    id="game-completed"
                    checked={preferences.gameCompleted}
                    onCheckedChange={checked => updatePreference('gameCompleted', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Tournament Notifications */}
            <div className="space-y-4">
              <h3 className="font-medium">Tournament Notifications</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tournament-start">Tournament Start</Label>
                    <p className="text-sm text-muted-foreground">When tournaments begin</p>
                  </div>
                  <Switch
                    id="tournament-start"
                    checked={preferences.tournamentStart}
                    onCheckedChange={checked => updatePreference('tournamentStart', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tournament-rounds">Round Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      When new tournament rounds begin
                    </p>
                  </div>
                  <Switch
                    id="tournament-rounds"
                    checked={preferences.tournamentRounds}
                    onCheckedChange={checked => updatePreference('tournamentRounds', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Social Notifications */}
            <div className="space-y-4">
              <h3 className="font-medium">Social Notifications</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="friends-online">Friends Online</Label>
                    <p className="text-sm text-muted-foreground">When friends come online</p>
                  </div>
                  <Switch
                    id="friends-online"
                    checked={preferences.friendsOnline}
                    onCheckedChange={checked => updatePreference('friendsOnline', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="achievements">Achievements</Label>
                    <p className="text-sm text-muted-foreground">When you unlock achievements</p>
                  </div>
                  <Switch
                    id="achievements"
                    checked={preferences.achievements}
                    onCheckedChange={checked => updatePreference('achievements', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-messages">System Messages</Label>
                    <p className="text-sm text-muted-foreground">Important system announcements</p>
                  </div>
                  <Switch
                    id="system-messages"
                    checked={preferences.systemMessages}
                    onCheckedChange={checked => updatePreference('systemMessages', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Quiet Hours */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Quiet Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    Disable notifications during specific hours
                  </p>
                </div>
                <Switch
                  checked={preferences.quietHours.enabled}
                  onCheckedChange={checked => updateQuietHours('enabled', checked)}
                />
              </div>

              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <input
                      id="quiet-start"
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={e => updateQuietHours('start', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">End Time</Label>
                    <input
                      id="quiet-end"
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={e => updateQuietHours('end', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
