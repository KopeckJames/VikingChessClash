import React from 'react'
import { Bot, Wifi, Home, RotateCcw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useLocation } from 'wouter'
import { useConnectionStatus } from '../hooks/use-connection-status'
import { useOfflineGames } from '../hooks/use-offline-game'
import { OfflineGamesList } from '../components/offline-games-list'

export default function OfflinePage() {
  const [, setLocation] = useLocation()
  const { isOnline, testConnection } = useConnectionStatus()
  const { activeGames } = useOfflineGames()

  const handleGoHome = () => {
    setLocation('/')
  }

  const handleCreateOfflineGame = () => {
    setLocation('/offline-game')
  }

  const handleCheckConnection = async () => {
    const connected = await testConnection()
    if (connected) {
      setLocation('/')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl">
          ⚔️
        </div>
        <h1 className="text-4xl font-bold mb-4">You're Offline</h1>
        <p className="text-xl text-muted-foreground mb-6">
          No internet connection detected, but you can still enjoy Viking Chess!
        </p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="text-sm">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Online
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Offline
              </>
            )}
          </Badge>

          {activeGames.length > 0 && (
            <Badge variant="outline" className="text-sm">
              <Bot className="h-4 w-4 mr-2" />
              {activeGames.length} Active Offline Game{activeGames.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={handleGoHome} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Go to Home
          </Button>

          <Button
            variant="outline"
            onClick={handleCheckConnection}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Check Connection
          </Button>

          <Button
            variant="secondary"
            onClick={handleCreateOfflineGame}
            className="flex items-center gap-2"
          >
            <Bot className="h-4 w-4" />
            Play vs AI
          </Button>
        </div>
      </div>

      {/* Offline Features */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Available Offline Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">🎮 Gameplay</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Play against AI opponents
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Multiple difficulty levels (1-10)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Different AI personalities
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Continue existing games
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">📊 Data & Stats</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Game history and statistics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Move analysis and replay
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Export/import game data
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Offline data storage
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">🌐 Requires Internet Connection:</h4>
            <div className="text-sm text-muted-foreground">
              Multiplayer games, tournaments, real-time chat, leaderboards, and account
              synchronization
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Games List */}
      <OfflineGamesList
        onSelectGame={gameId => setLocation(`/offline-game/${gameId}`)}
        onCreateGame={handleCreateOfflineGame}
      />

      {/* Connection Status */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            {isOnline ? (
              <div className="text-green-600 dark:text-green-400">
                <Wifi className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Connection Restored!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  You can now access all online features
                </p>
                <Button onClick={handleGoHome}>Return to Full App</Button>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No Internet Connection</p>
                <p className="text-sm mb-4">
                  The app will automatically reconnect when your connection is restored
                </p>
                <Button variant="outline" onClick={handleCheckConnection}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
