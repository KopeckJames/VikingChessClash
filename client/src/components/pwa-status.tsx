import React from 'react'
import {
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Download,
  Check,
  X,
  Monitor,
  Bot,
  Database,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { useConnectionStatus } from '../hooks/use-connection-status'
import { usePWAInstall } from './pwa-install-prompt'
import { pushNotificationService } from '../lib/push-notifications'
import { useOfflineGames } from '../hooks/use-offline-game'

export function PWAStatus() {
  const { isOnline, connectionType, effectiveType } = useConnectionStatus()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const { activeGames, games } = useOfflineGames()

  const [notificationPermission, setNotificationPermission] =
    React.useState<NotificationPermission>('default')
  const [serviceWorkerStatus, setServiceWorkerStatus] = React.useState<
    'supported' | 'registered' | 'not-supported'
  >('not-supported')

  React.useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        setServiceWorkerStatus(registration ? 'registered' : 'supported')
      })
    }
  }, [])

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (status: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'} className="ml-2">
        {status ? trueText : falseText}
      </Badge>
    )
  }

  const handleInstall = async () => {
    const success = await install()
    if (success) {
      console.log('App installed successfully')
    }
  }

  const handleEnableNotifications = async () => {
    try {
      await pushNotificationService.init()
      await pushNotificationService.subscribe()
      setNotificationPermission('granted')
    } catch (error) {
      console.error('Failed to enable notifications:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* PWA Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Progressive Web App Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(isInstalled)}
              <span>App Installation</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(isInstalled, 'Installed', 'Not Installed')}
              {isInstallable && !isInstalled && (
                <Button size="sm" onClick={handleInstall}>
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(serviceWorkerStatus === 'registered')}
              <span>Service Worker</span>
            </div>
            {getStatusBadge(
              serviceWorkerStatus === 'registered',
              'Active',
              serviceWorkerStatus === 'supported' ? 'Supported' : 'Not Supported'
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(isOnline)}
              <span>Network Connection</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(isOnline, 'Online', 'Offline')}
              {isOnline && connectionType && (
                <Badge variant="outline" className="capitalize">
                  {effectiveType || connectionType}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(notificationPermission === 'granted')}
              <span>Push Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(
                notificationPermission === 'granted',
                'Enabled',
                notificationPermission === 'denied' ? 'Denied' : 'Not Enabled'
              )}
              {notificationPermission === 'default' && (
                <Button size="sm" variant="outline" onClick={handleEnableNotifications}>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Features Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            Offline Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>AI Opponents</span>
            </div>
            <Badge variant="default">Available</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Local Game Storage</span>
            </div>
            <Badge variant="default">Active</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>Offline Games</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{games.length} Total</Badge>
              {activeGames.length > 0 && (
                <Badge variant="default">{activeGames.length} Active</Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">What works offline:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Play against AI opponents with multiple difficulty levels</li>
              <li>Access game history and statistics</li>
              <li>Continue existing offline games</li>
              <li>View and manage your profile</li>
              <li>Browse cached content and tutorials</li>
            </ul>
          </div>

          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">Requires internet connection:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Multiplayer games with other players</li>
              <li>Tournament participation</li>
              <li>Real-time chat and social features</li>
              <li>Leaderboards and rankings</li>
              <li>Account synchronization</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* PWA Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            PWA Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile Experience
              </h4>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li>Native app-like interface</li>
                <li>Full-screen gameplay</li>
                <li>Touch-optimized controls</li>
                <li>Home screen installation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Performance
              </h4>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li>Faster loading times</li>
                <li>Offline functionality</li>
                <li>Background updates</li>
                <li>Reduced data usage</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </h4>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li>Game move alerts</li>
                <li>Tournament updates</li>
                <li>Friend activity</li>
                <li>Achievement unlocks</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Management
              </h4>
              <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                <li>Automatic sync when online</li>
                <li>Local data backup</li>
                <li>Cross-device compatibility</li>
                <li>Secure data storage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
