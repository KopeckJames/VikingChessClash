import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Crown,
  Shield,
  Sword,
  Eye,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Lightbulb,
  Star,
  X,
} from 'lucide-react'
import { GameAnalysisEngine, type GameAnalysis, type MoveEvaluation } from '@/lib/game-analysis'
import type { Game, Move, BoardState } from '@shared/schema'

interface GameAnalysisProps {
  game: Game
  onClose?: () => void
}

export default function GameAnalysisComponent({ game, onClose }: GameAnalysisProps) {
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'moves' | 'tactics' | 'insights'>(
    'overview'
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analysisEngine = new GameAnalysisEngine()

  useEffect(() => {
    analyzeGame()
  }, [game])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && analysis) {
      interval = setInterval(() => {
        setCurrentMoveIndex(prev => {
          if (prev >= analysis.moves.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, analysis])

  const analyzeGame = async () => {
    setIsAnalyzing(true)
    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      const moves = (game.moveHistory as Move[]) || []
      const initialBoard = game.boardState as BoardState

      const gameAnalysis = analysisEngine.analyzeGame(moves, initialBoard)
      setAnalysis(gameAnalysis)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getMoveEvaluationColor = (evaluation: MoveEvaluation['evaluation']) => {
    switch (evaluation) {
      case 'brilliant':
        return 'text-yellow-400'
      case 'great':
        return 'text-green-400'
      case 'good':
        return 'text-blue-400'
      case 'inaccuracy':
        return 'text-orange-400'
      case 'mistake':
        return 'text-red-400'
      case 'blunder':
        return 'text-red-600'
    }
  }

  const getMoveEvaluationIcon = (evaluation: MoveEvaluation['evaluation']) => {
    switch (evaluation) {
      case 'brilliant':
        return <Star className="w-4 h-4" />
      case 'great':
        return <CheckCircle className="w-4 h-4" />
      case 'good':
        return <TrendingUp className="w-4 h-4" />
      case 'inaccuracy':
        return <TrendingDown className="w-4 h-4" />
      case 'mistake':
        return <AlertTriangle className="w-4 h-4" />
      case 'blunder':
        return <X className="w-4 h-4" />
    }
  }

  const getTacticalThemeColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-500/20'
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'low':
        return 'text-blue-400 bg-blue-500/20'
    }
  }

  if (isAnalyzing) {
    return (
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Analyzing Game</h3>
          <p className="text-gray-400">
            Our AI is evaluating every move and finding tactical patterns...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <CardContent className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">Analysis Failed</h3>
          <p className="text-gray-500 mb-4">Unable to analyze this game. Please try again.</p>
          <Button onClick={analyzeGame} className="bg-gradient-to-r from-yellow-400 to-yellow-600">
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentMove = analysis.moves[currentMoveIndex]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">Game Analysis</h2>
          <p className="text-gray-400">Deep analysis of your game with AI insights</p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'moves', label: 'Move Analysis', icon: Target },
          { id: 'tactics', label: 'Tactical Themes', icon: Zap },
          { id: 'insights', label: 'Key Insights', icon: Lightbulb },
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
          {/* Accuracy Cards */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-blue-400" />
                Defender Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{analysis.accuracy.white}%</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                  style={{ width: `${analysis.accuracy.white}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Sword className="w-4 h-4 mr-2 text-red-400" />
                Attacker Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{analysis.accuracy.black}%</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full"
                  style={{ width: `${analysis.accuracy.black}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Brilliant Moves */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-400" />
                Brilliant Moves
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {analysis.brilliantMoves.length}
              </div>
              <div className="text-xs text-gray-400 mt-1">Exceptional plays</div>
            </CardContent>
          </Card>

          {/* Blunders */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                Blunders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{analysis.blunders.length}</div>
              <div className="text-xs text-gray-400 mt-1">Major mistakes</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Move Analysis Tab */}
      {selectedTab === 'moves' && (
        <div className="space-y-6">
          {/* Move Player Controls */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Move Replay</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMoveIndex(0)}
                    disabled={currentMoveIndex === 0}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1))}
                    disabled={currentMoveIndex === 0}
                  >
                    <TrendingDown className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setCurrentMoveIndex(Math.min(analysis.moves.length - 1, currentMoveIndex + 1))
                    }
                    disabled={currentMoveIndex >= analysis.moves.length - 1}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMoveIndex(analysis.moves.length - 1)}
                    disabled={currentMoveIndex >= analysis.moves.length - 1}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    Move {currentMoveIndex + 1} of {analysis.moves.length}
                  </span>
                  <span className="text-gray-400">
                    {Math.round(((currentMoveIndex + 1) / analysis.moves.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentMoveIndex + 1) / analysis.moves.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Move Details */}
              {currentMove && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={cn(
                          'flex items-center space-x-1',
                          getMoveEvaluationColor(currentMove.evaluation)
                        )}
                      >
                        {getMoveEvaluationIcon(currentMove.evaluation)}
                        <span className="font-semibold capitalize">{currentMove.evaluation}</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        Score: {currentMove.score > 0 ? '+' : ''}
                        {currentMove.score}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm">{currentMove.reasoning}</p>

                  {currentMove.alternatives && currentMove.alternatives.length > 0 && (
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-400 mb-2">
                        Better Alternatives:
                      </h4>
                      <div className="space-y-1">
                        {currentMove.alternatives.map((alt, index) => (
                          <div key={index} className="text-xs text-blue-300">
                            Alternative {index + 1}: {alt.from.row},{alt.from.col} → {alt.to.row},
                            {alt.to.col}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentMove.tacticalThemes && currentMove.tacticalThemes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-400">Tactical Themes:</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentMove.tacticalThemes.map((theme, index) => (
                          <Badge
                            key={index}
                            className={cn('text-xs', getTacticalThemeColor(theme.severity))}
                          >
                            {theme.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Move List */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">All Moves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {analysis.moves.map((move, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
                      index === currentMoveIndex ? 'bg-yellow-400/20' : 'hover:bg-white/5'
                    )}
                    onClick={() => setCurrentMoveIndex(index)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-400 w-8">{index + 1}.</span>
                      <div
                        className={cn(
                          'flex items-center space-x-1',
                          getMoveEvaluationColor(move.evaluation)
                        )}
                      >
                        {getMoveEvaluationIcon(move.evaluation)}
                        <span className="text-sm capitalize">{move.evaluation}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {move.move.from.row},{move.move.from.col} → {move.move.to.row},
                      {move.move.to.col}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tactical Themes Tab */}
      {selectedTab === 'tactics' && (
        <div className="space-y-4">
          {analysis.tacticalOpportunities.length > 0 ? (
            analysis.tacticalOpportunities.map((theme, index) => (
              <Card key={index} className="bg-white/5 backdrop-blur-lg border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Zap
                        className={cn(
                          'w-5 h-5 mt-0.5',
                          theme.severity === 'high'
                            ? 'text-red-400'
                            : theme.severity === 'medium'
                              ? 'text-yellow-400'
                              : 'text-blue-400'
                        )}
                      />
                      <div>
                        <h3 className="font-semibold text-white capitalize">{theme.type}</h3>
                        <p className="text-sm text-gray-300 mt-1">{theme.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={cn('text-xs', getTacticalThemeColor(theme.severity))}>
                            {theme.severity} priority
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {theme.squares.length} squares involved
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardContent className="text-center py-8">
                <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  No Tactical Themes Found
                </h3>
                <p className="text-gray-500">
                  This game didn't feature any notable tactical patterns.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Key Insights Tab */}
      {selectedTab === 'insights' && (
        <div className="space-y-4">
          {analysis.keyMoments.length > 0 ? (
            analysis.keyMoments.map((moment, index) => (
              <Card key={index} className="bg-white/5 backdrop-blur-lg border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                        moment.impact === 'game-changing'
                          ? 'bg-red-500 text-white'
                          : moment.impact === 'significant'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-blue-500 text-white'
                      )}
                    >
                      {moment.moveNumber}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-white">Move {moment.moveNumber}</h3>
                        <Badge
                          className={cn(
                            'text-xs',
                            moment.impact === 'game-changing'
                              ? 'bg-red-500'
                              : moment.impact === 'significant'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-blue-500'
                          )}
                        >
                          {moment.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300">{moment.description}</p>
                      <div className="text-xs text-gray-400 mt-1">
                        Evaluation: {moment.evaluation > 0 ? '+' : ''}
                        {moment.evaluation}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardContent className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No Key Moments</h3>
                <p className="text-gray-500">
                  This was a steady game without dramatic turning points.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
