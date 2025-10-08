import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Crown,
  Shield,
  Sword,
  Target,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Star,
  Clock,
  Users,
  Zap,
  TrendingUp,
  Eye,
  Play,
} from 'lucide-react'

interface StrategyGuide {
  id: string
  title: string
  description: string
  category: 'opening' | 'middlegame' | 'endgame' | 'tactics'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  role: 'attacker' | 'defender' | 'both'
  readTime: number // in minutes
  rating: number
  views: number
  content: StrategySection[]
  tags: string[]
}

interface StrategySection {
  id: string
  title: string
  content: string
  diagrams?: BoardDiagram[]
  tips?: string[]
  examples?: string[]
}

interface BoardDiagram {
  id: string
  title: string
  description: string
  position: string // FEN-like notation for Hnefatafl
  annotations?: { square: string; text: string }[]
}

const mockGuides: StrategyGuide[] = [
  {
    id: 'defender-opening-principles',
    title: 'Defender Opening Principles',
    description: 'Master the fundamental opening strategies for the defending side',
    category: 'opening',
    difficulty: 'beginner',
    role: 'defender',
    readTime: 8,
    rating: 4.8,
    views: 1247,
    tags: ['fundamentals', 'king-safety', 'piece-development'],
    content: [
      {
        id: 'section-1',
        title: 'King Safety First',
        content:
          "The primary goal in the opening is to ensure the king's safety while developing your pieces. Never rush the king forward without proper support.",
        tips: [
          'Keep the king protected by at least 2 defenders',
          'Avoid moving the king too early',
          'Control the center squares around the throne',
        ],
      },
      {
        id: 'section-2',
        title: 'Piece Development',
        content:
          "Develop your defenders to active squares where they can support the king's escape and control key areas of the board.",
        examples: [
          'Move defenders to the 4th and 6th ranks early',
          'Control the central files',
          'Prepare escape routes to the corners',
        ],
      },
    ],
  },
  {
    id: 'attacker-encirclement',
    title: 'Attacker Encirclement Strategy',
    description: 'Learn how to systematically surround and capture the king',
    category: 'middlegame',
    difficulty: 'intermediate',
    role: 'attacker',
    readTime: 12,
    rating: 4.6,
    views: 892,
    tags: ['encirclement', 'coordination', 'king-hunt'],
    content: [
      {
        id: 'section-1',
        title: 'The Closing Net',
        content:
          "Attackers must work together to gradually reduce the king's mobility while maintaining pressure from all sides.",
        tips: [
          'Coordinate your pieces to control escape squares',
          "Don't rush - patience is key",
          'Force the king toward the center or edges',
        ],
      },
    ],
  },
  {
    id: 'endgame-king-escape',
    title: 'King Escape Techniques',
    description: 'Advanced techniques for getting the king to safety in complex endgames',
    category: 'endgame',
    difficulty: 'advanced',
    role: 'defender',
    readTime: 15,
    rating: 4.9,
    views: 634,
    tags: ['king-escape', 'endgame', 'calculation'],
    content: [
      {
        id: 'section-1',
        title: 'Breakthrough Sacrifices',
        content:
          'Sometimes sacrificing defenders is necessary to create a path for the king to escape.',
        examples: [
          'Sacrifice a defender to open a file',
          'Use decoy tactics to misdirect attackers',
          'Calculate forcing sequences accurately',
        ],
      },
    ],
  },
]

interface StrategyGuidesProps {
  selectedCategory?: StrategyGuide['category']
  selectedRole?: StrategyGuide['role']
}

export default function StrategyGuides({ selectedCategory, selectedRole }: StrategyGuidesProps) {
  const [currentGuide, setCurrentGuide] = useState<StrategyGuide | null>(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [filterCategory, setFilterCategory] = useState<StrategyGuide['category'] | 'all'>(
    selectedCategory || 'all'
  )
  const [filterRole, setFilterRole] = useState<StrategyGuide['role'] | 'all'>(selectedRole || 'all')
  const [filterDifficulty, setFilterDifficulty] = useState<StrategyGuide['difficulty'] | 'all'>(
    'all'
  )

  const filteredGuides = mockGuides.filter(guide => {
    if (filterCategory !== 'all' && guide.category !== filterCategory) return false
    if (filterRole !== 'all' && guide.role !== filterRole && guide.role !== 'both') return false
    if (filterDifficulty !== 'all' && guide.difficulty !== filterDifficulty) return false
    return true
  })

  const getCategoryIcon = (category: StrategyGuide['category']) => {
    switch (category) {
      case 'opening':
        return <Play className="w-4 h-4" />
      case 'middlegame':
        return <Target className="w-4 h-4" />
      case 'endgame':
        return <Crown className="w-4 h-4" />
      case 'tactics':
        return <Zap className="w-4 h-4" />
    }
  }

  const getRoleIcon = (role: StrategyGuide['role']) => {
    switch (role) {
      case 'attacker':
        return <Sword className="w-4 h-4 text-red-400" />
      case 'defender':
        return <Shield className="w-4 h-4 text-blue-400" />
      case 'both':
        return <Users className="w-4 h-4 text-purple-400" />
    }
  }

  const getDifficultyColor = (difficulty: StrategyGuide['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500'
      case 'intermediate':
        return 'bg-yellow-500'
      case 'advanced':
        return 'bg-red-500'
    }
  }

  const handleNextSection = () => {
    if (currentGuide && currentSection < currentGuide.content.length - 1) {
      setCurrentSection(prev => prev + 1)
    }
  }

  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
    }
  }

  if (currentGuide) {
    const section = currentGuide.content[currentSection]

    return (
      <div className="space-y-6">
        {/* Guide Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => setCurrentGuide(null)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Guides
            </Button>
            <div>
              <h2 className="text-xl font-bold text-yellow-400">{currentGuide.title}</h2>
              <div className="flex items-center space-x-2 mt-1">
                {getRoleIcon(currentGuide.role)}
                <Badge className={cn('text-white', getDifficultyColor(currentGuide.difficulty))}>
                  {currentGuide.difficulty}
                </Badge>
                <div className="flex items-center text-sm text-gray-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {currentGuide.readTime} min read
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Star className="w-3 h-3 mr-1 text-yellow-400" />
                  {currentGuide.rating}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Section {currentSection + 1} of {currentGuide.content.length}
            </span>
            <span className="text-gray-400">
              {Math.round(((currentSection + 1) / currentGuide.content.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSection + 1) / currentGuide.content.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Section */}
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              {getCategoryIcon(currentGuide.category)}
              <span className="ml-2">{section.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-300 leading-relaxed">{section.content}</p>

            {/* Tips */}
            {section.tips && section.tips.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-400 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Key Tips
                </h4>
                <ul className="space-y-2">
                  {section.tips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Examples */}
            {section.examples && section.examples.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-400 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Examples
                </h4>
                <ul className="space-y-2">
                  {section.examples.map((example, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Board Placeholder */}
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-4 rounded-lg">
              <div className="aspect-square bg-amber-50 rounded-lg flex items-center justify-center">
                <p className="text-amber-800 text-sm">Interactive Strategy Board</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevSection}
                disabled={currentSection === 0}
                className="border-gray-600"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handleNextSection}
                disabled={currentSection === currentGuide.content.length - 1}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900"
              >
                Next Section
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">Strategy Guides</h2>
          <p className="text-gray-400">Master the art of Hnefatafl with expert strategies</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Category:</span>
          <div className="flex space-x-1">
            {['all', 'opening', 'middlegame', 'endgame', 'tactics'].map(category => (
              <Button
                key={category}
                variant={filterCategory === category ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterCategory(category as any)}
                className={cn(
                  'text-xs',
                  filterCategory === category ? 'bg-yellow-400 text-yellow-900' : 'text-gray-400'
                )}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Role:</span>
          <div className="flex space-x-1">
            {['all', 'attacker', 'defender', 'both'].map(role => (
              <Button
                key={role}
                variant={filterRole === role ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterRole(role as any)}
                className={cn(
                  'text-xs',
                  filterRole === role ? 'bg-yellow-400 text-yellow-900' : 'text-gray-400'
                )}
              >
                {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuides.map(guide => (
          <Card
            key={guide.id}
            className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
            onClick={() => setCurrentGuide(guide)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(guide.category)}
                  <CardTitle className="text-base text-white group-hover:text-yellow-400 transition-colors">
                    {guide.title}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(guide.role)}
                  <Badge className={cn('text-white text-xs', getDifficultyColor(guide.difficulty))}>
                    {guide.difficulty}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-300 text-sm line-clamp-2">{guide.description}</p>

              <div className="flex flex-wrap gap-1">
                {guide.tags.slice(0, 3).map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs border-gray-600 text-gray-400"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {guide.readTime} min
                  </div>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 mr-1 text-yellow-400" />
                    {guide.rating}
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {guide.views}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 group-hover:text-yellow-400 transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGuides.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No guides found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more strategy guides.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
