import React, { useState } from 'react'
import { Bot, Crown, Sword, Clock, Trophy, Trash2, Download, Upload, RotateCcw } from 'lucide-react'
import { useOfflineGames } from '../hooks/use-offline-game'
import { AI_PERSONALITIES } from '@shared/ai-engine'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ConnectionStatus } from './connection-status'

interface OfflineGamesListProps {
  onSelectGame?: (gameId: string) => void
  onCreateGame?: () => void
}

export function OfflineGamesList({ onSelectGame, onCreateGame }: OfflineGamesListProps) {
  const {
    games,
    activeGames,
    gameHistory,
    isLoading,
    clearAllData,
    exportData,
    importData,
    isClearing,
    isExporting,
    isImporting,
  } = useOfflineGames()

  const [importFile, setImportFile] = useState<File | null>(null)

  const handleImport = async () => {
    if (!importFile) return

    try {
      const text = await importFile.text()
      await importData(text)
      setImportFile(null)
    } catch (error) {
      console.error('Import failed:', error)
      alert('Failed to import data. Please check the file format.')
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setImportFile(file || null)
  }

  const formatGameDuration = (createdAt: number, updatedAt: number) => {
    const duration = updatedAt - createdAt
    const minutes = Math.floor(duration / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return 'Beginner'
    if (difficulty <= 4) return 'Easy'
    if (difficulty <= 6) return 'Medium'
    if (difficulty <= 8) return 'Hard'
    return 'Expert'
  }

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'aggressive':
        return <Sword className="h-3 w-3" />
      case 'defensive':
        return <Crown className="h-3 w-3" />
      default:
        return <Bot className="h-3 w-3" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading offline games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <ConnectionStatus showDetails className="mb-6" />

      {/* Statistics */}
      {gameHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Offline Game Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{gameHistory.totalGames}</div>
                <div className="text-sm text-muted-foreground">Total Games</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{gameHistory.wins}</div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{gameHistory.losses}</div>
                <div className="text-sm text-muted-foreground">Losses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{gameHistory.draws}</div>
                <div className="text-sm text-muted-foreground">Draws</div>
              </div>
            </div>

            {gameHistory.totalGames > 0 && (
              <div className="mt-4 text-center">
                <div className="text-sm text-muted-foreground">
                  Win Rate: {Math.round((gameHistory.wins / gameHistory.totalGames) * 100)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Games */}
      {activeGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Games ({activeGames.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeGames.map(game => (
              <div
                key={game.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => onSelectGame?.(game.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {game.playerRole === 'attacker' ? (
                      <Sword className="h-4 w-4 text-red-500" />
                    ) : (
                      <Crown className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="font-medium">You vs AI</span>
                  </div>

                  <Badge variant="outline" className="flex items-center gap-1">
                    {getPersonalityIcon(game.aiPersonality)}
                    <span className="capitalize">{game.aiPersonality}</span>
                  </Badge>

                  <Badge variant="secondary">{getDifficultyLabel(game.aiDifficulty)}</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{game.moveHistory.length} moves</span>
                  <span>•</span>
                  <span>{formatDate(game.createdAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Completed Games */}
      {games.filter(g => g.status === 'completed').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Completed Games
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {games
              .filter(g => g.status === 'completed')
              .slice(0, 5)
              .map(game => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {game.winner === game.playerRole ? (
                        <Trophy className="h-4 w-4 text-green-500" />
                      ) : game.winner ? (
                        <Bot className="h-4 w-4 text-red-500" />
                      ) : (
                        <RotateCcw className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium">
                        {game.winner === game.playerRole
                          ? 'Victory'
                          : game.winner
                            ? 'Defeat'
                            : 'Draw'}
                      </span>
                    </div>

                    <Badge variant="outline" className="flex items-center gap-1">
                      {getPersonalityIcon(game.aiPersonality)}
                      <span className="capitalize">{game.aiPersonality}</span>
                    </Badge>

                    <Badge variant="secondary">{getDifficultyLabel(game.aiDifficulty)}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{game.moveHistory.length} moves</span>
                    <span>•</span>
                    <span>{formatGameDuration(game.createdAt, game.updatedAt)}</span>
                    <span>•</span>
                    <span>{formatDate(game.completedAt || game.updatedAt)}</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={exportData}
              disabled={isExporting || games.length === 0}
              variant="outline"
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Games
                </>
              )}
            </Button>

            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input type="file" accept=".json" onChange={handleFileChange} className="flex-1" />
                <Button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  variant="outline"
                >
                  {isImporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Clear All Data</p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete all offline games and statistics
              </p>
            </div>
            <Button
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to delete all offline game data? This cannot be undone.'
                  )
                ) {
                  clearAllData()
                }
              }}
              disabled={isClearing || games.length === 0}
              variant="destructive"
            >
              {isClearing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create New Game */}
      {games.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Offline Games</h3>
            <p className="text-muted-foreground mb-4">
              Create your first offline game to play against AI opponents
            </p>
            <Button onClick={onCreateGame}>
              <Bot className="h-4 w-4 mr-2" />
              Create Offline Game
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
