import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  BarChart3,
  Lightbulb,
  Target,
  Crown,
  Shield,
  Sword,
  TrendingUp,
  Users,
  Play,
  ArrowLeft,
} from 'lucide-react'
import TutorialSystem from '@/components/tutorial-system'
import AnalyticsDashboard from '@/components/analytics-dashboard'
import StrategyGuides from '@/components/strategy-guides'
import HintsSystem from '@/components/hints-system'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import LogoutButton from '@/components/logout-button'
import { updateSEO, seoPages } from '@/lib/seo'
import { analytics } from '@/lib/analytics'

type LearningSection = 'overview' | 'tutorials' | 'analytics' | 'guides' | 'hints'

interface LearningStats {
  completedTutorials: number
  totalTutorials: number
  currentRating: number
  ratingChange: number
  studyTime: number // in minutes
  favoriteGuides: number
}

const mockStats: LearningStats = {
  completedTutorials: 8,
  totalTutorials: 15,
  currentRating: 1456,
  ratingChange: +24,
  studyTime: 127,
  favoriteGuides: 5,
}

export default function Learning() {
  const [, navigate] = useLocation()
  const [activeSection, setActiveSection] = useState<LearningSection>('overview')
  const [stats, setStats] = useState<LearningStats>(mockStats)

  // Check if user is authenticated
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')

  useEffect(() => {
    updateSEO(
      seoPages.learning || {
        title: 'Learning Center - Viking Chess',
        description: 'Improve your Hnefatafl skills with tutorials, analytics, and strategy guides',
        keywords: 'hnefatafl tutorial, viking chess strategy, game analysis, learning',
      }
    )
    analytics.trackPageView('/learning', 'Learning Center')
  }, [])

  if (!currentUser) {
    navigate('/auth')
    return null
  }

  const learningModules = [
    {
      id: 'tutorials',
      title: 'Interactive Tutorials',
      description: 'Step-by-step lessons to master the fundamentals',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      stats: `${stats.completedTutorials}/${stats.totalTutorials} completed`,
      progress: (stats.completedTutorials / stats.totalTutorials) * 100,
    },
    {
      id: 'analytics',
      title: 'Performance Analytics',
      description: 'Track your progress and identify areas for improvement',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      stats: `${stats.currentRating} rating (${stats.ratingChange > 0 ? '+' : ''}${stats.ratingChange})`,
      progress: Math.min((stats.currentRating / 2000) * 100, 100),
    },
    {
      id: 'guides',
      title: 'Strategy Guides',
      description: 'Expert strategies and opening libraries',
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      stats: `${stats.favoriteGuides} guides bookmarked`,
      progress: 75, // Placeholder
    },
    {
      id: 'hints',
      title: 'Smart Hints System',
      description: 'Get personalized suggestions during games',
      icon: Lightbulb,
      color: 'from-yellow-500 to-yellow-600',
      stats: `${stats.studyTime} minutes studied`,
      progress: Math.min((stats.studyTime / 200) * 100, 100),
    },
  ]

  const quickActions = [
    {
      title: 'Continue Last Tutorial',
      description: 'Basic Piece Movement - Step 3/5',
      icon: Play,
      action: () => setActiveSection('tutorials'),
      color: 'bg-blue-500/20 border-blue-500/30',
    },
    {
      title: 'Review Recent Games',
      description: 'Analyze your last 5 games',
      icon: BarChart3,
      action: () => setActiveSection('analytics'),
      color: 'bg-green-500/20 border-green-500/30',
    },
    {
      title: 'Study Endgames',
      description: 'Master king escape techniques',
      icon: Crown,
      action: () => setActiveSection('guides'),
      color: 'bg-purple-500/20 border-purple-500/30',
    },
  ]

  if (activeSection !== 'overview') {
    return (
      <div className="min-h-screen">
        <BreadcrumbNav />

        {/* Header */}
        <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => setActiveSection('overview')}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Learning
                </Button>
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-yellow-900" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-yellow-400">Learning Center</h1>
                  <p className="text-sm text-gray-400">
                    {activeSection === 'tutorials' && 'Interactive Tutorials'}
                    {activeSection === 'analytics' && 'Performance Analytics'}
                    {activeSection === 'guides' && 'Strategy Guides'}
                    {activeSection === 'hints' && 'Smart Hints System'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-400">{stats.currentRating}</div>
                  <div className="text-xs text-gray-400">Rating</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {currentUser.displayName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <LogoutButton
                    variant="ghost"
                    size="sm"
                    showText={false}
                    className="text-red-400 hover:bg-red-600 hover:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-6">
          {activeSection === 'tutorials' && <TutorialSystem />}
          {activeSection === 'analytics' && <AnalyticsDashboard userId={currentUser.id} />}
          {activeSection === 'guides' && <StrategyGuides />}
          {activeSection === 'hints' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">Smart Hints System</h2>
                <p className="text-gray-400">Configure and test the intelligent hint system</p>
              </div>
              <HintsSystem
                settings={{
                  enabled: true,
                  showDuringGame: true,
                  difficulty: 'all',
                  autoShow: false,
                  showReasons: true,
                }}
              />
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <BreadcrumbNav />

      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/lobby')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lobby
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-yellow-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-yellow-400">Learning Center</h1>
                <p className="text-sm text-gray-400">Master the art of Hnefatafl</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-bold text-yellow-400">{stats.currentRating}</div>
                <div className="text-xs text-gray-400">Current Rating</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {currentUser.displayName.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <LogoutButton
                  variant="ghost"
                  size="sm"
                  showText={false}
                  className="text-red-400 hover:bg-red-600 hover:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">Welcome to the Learning Center</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Improve your Hnefatafl skills with interactive tutorials, detailed analytics, expert
              strategy guides, and intelligent hints. Track your progress and become a master
              tactician.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className={cn('cursor-pointer transition-all hover:scale-105', action.color)}
                onClick={action.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <action.icon className="w-6 h-6 text-white mt-1" />
                    <div>
                      <h3 className="font-semibold text-white">{action.title}</h3>
                      <p className="text-sm text-gray-300 mt-1">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Learning Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningModules.map(module => (
              <Card
                key={module.id}
                className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                onClick={() => setActiveSection(module.id as LearningSection)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                          module.color
                        )}
                      >
                        <module.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white group-hover:text-yellow-400 transition-colors">
                          {module.title}
                        </CardTitle>
                        <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{module.stats}</span>
                      <span className="text-gray-400">{Math.round(module.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all duration-300 bg-gradient-to-r',
                          module.color
                        )}
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900"
                    onClick={e => {
                      e.stopPropagation()
                      setActiveSection(module.id as LearningSection)
                    }}
                  >
                    {module.id === 'tutorials' && 'Start Learning'}
                    {module.id === 'analytics' && 'View Analytics'}
                    {module.id === 'guides' && 'Browse Guides'}
                    {module.id === 'hints' && 'Configure Hints'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress Overview */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">Your Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{stats.completedTutorials}</div>
                  <div className="text-xs text-blue-300">Tutorials Completed</div>
                </div>
                <div className="text-center p-4 bg-green-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{stats.currentRating}</div>
                  <div className="text-xs text-green-300">Current Rating</div>
                </div>
                <div className="text-center p-4 bg-purple-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{stats.studyTime}m</div>
                  <div className="text-xs text-purple-300">Study Time</div>
                </div>
                <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">{stats.favoriteGuides}</div>
                  <div className="text-xs text-yellow-300">Guides Bookmarked</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
