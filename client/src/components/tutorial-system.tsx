import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Crown,
  Shield,
  Sword,
  Target,
  Lightbulb,
  BookOpen,
} from 'lucide-react'

interface TutorialStep {
  id: string
  title: string
  description: string
  boardPosition?: { row: number; col: number }
  highlightSquares?: { row: number; col: number }[]
  action?: 'move' | 'capture' | 'observe'
  hint?: string
  completed?: boolean
}

interface TutorialLesson {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // in minutes
  steps: TutorialStep[]
  category: 'basics' | 'strategy' | 'tactics' | 'endgame'
}

const tutorialLessons: TutorialLesson[] = [
  {
    id: 'basic-movement',
    title: 'Basic Piece Movement',
    description: 'Learn how pieces move in Hnefatafl',
    difficulty: 'beginner',
    estimatedTime: 5,
    category: 'basics',
    steps: [
      {
        id: 'step-1',
        title: 'Understanding the Board',
        description:
          'The Hnefatafl board is 11x11 with special squares: the throne (center) and four corners.',
        hint: 'Tap the highlighted squares to see their special properties',
      },
      {
        id: 'step-2',
        title: 'Moving Pieces',
        description:
          'All pieces move like a rook in chess - horizontally or vertically any number of squares.',
        action: 'move',
        hint: 'Try moving a defender piece',
      },
    ],
  },
  {
    id: 'king-escape',
    title: 'King Escape Victory',
    description: 'Learn how the defenders can win by getting the king to safety',
    difficulty: 'beginner',
    estimatedTime: 8,
    category: 'strategy',
    steps: [
      {
        id: 'step-1',
        title: "The King's Goal",
        description: 'The king must reach any corner square to win the game for the defenders.',
        highlightSquares: [
          { row: 0, col: 0 },
          { row: 0, col: 10 },
          { row: 10, col: 0 },
          { row: 10, col: 10 },
        ],
      },
    ],
  },
]

interface TutorialSystemProps {
  onClose?: () => void
  selectedLesson?: string
}

export default function TutorialSystem({ onClose, selectedLesson }: TutorialSystemProps) {
  const [currentLesson, setCurrentLesson] = useState<TutorialLesson | null>(
    selectedLesson ? tutorialLessons.find(l => l.id === selectedLesson) || null : null
  )
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const currentStep = currentLesson?.steps[currentStepIndex]

  const handleNextStep = () => {
    if (currentLesson && currentStepIndex < currentLesson.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleStepComplete = () => {
    if (currentStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep.id]))
      // Auto-advance to next step after a short delay
      setTimeout(() => {
        handleNextStep()
      }, 1000)
    }
  }

  const handleRestart = () => {
    setCurrentStepIndex(0)
    setCompletedSteps(new Set())
    setIsPlaying(false)
  }

  const getDifficultyColor = (difficulty: TutorialLesson['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500'
      case 'intermediate':
        return 'bg-yellow-500'
      case 'advanced':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: TutorialLesson['category']) => {
    switch (category) {
      case 'basics':
        return <BookOpen className="w-4 h-4" />
      case 'strategy':
        return <Target className="w-4 h-4" />
      case 'tactics':
        return <Sword className="w-4 h-4" />
      case 'endgame':
        return <Crown className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  if (!currentLesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-yellow-400">Interactive Tutorials</h2>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tutorialLessons.map(lesson => (
            <Card
              key={lesson.id}
              className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              onClick={() => setCurrentLesson(lesson)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(lesson.category)}
                    <CardTitle className="text-lg text-white">{lesson.title}</CardTitle>
                  </div>
                  <Badge className={cn('text-white', getDifficultyColor(lesson.difficulty))}>
                    {lesson.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-3">{lesson.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{lesson.steps.length} steps</span>
                  <span>~{lesson.estimatedTime} min</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tutorial Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={() => setCurrentLesson(null)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-yellow-400">{currentLesson.title}</h2>
            <p className="text-sm text-gray-400">{currentLesson.description}</p>
          </div>
        </div>
        <Badge className={cn('text-white', getDifficultyColor(currentLesson.difficulty))}>
          {currentLesson.difficulty}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Step {currentStepIndex + 1} of {currentLesson.steps.length}
          </span>
          <span className="text-gray-400">
            {Math.round(((currentStepIndex + 1) / currentLesson.steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / currentLesson.steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      {currentStep && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center">
                {completedSteps.has(currentStep.id) && (
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                )}
                {currentStep.title}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-yellow-400"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRestart}
                  className="text-gray-400"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">{currentStep.description}</p>

            {currentStep.hint && (
              <div className="flex items-start space-x-2 p-3 bg-blue-500/20 rounded-lg">
                <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-300">{currentStep.hint}</p>
              </div>
            )}

            {/* Interactive Board Area - Placeholder for now */}
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-4 rounded-lg">
              <div className="aspect-square bg-amber-50 rounded-lg flex items-center justify-center">
                <p className="text-amber-800 text-sm">Interactive Board Tutorial</p>
              </div>
            </div>

            {/* Step Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="border-gray-600"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center space-x-2">
                {currentStep.action && (
                  <Button
                    onClick={handleStepComplete}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    Complete Step
                  </Button>
                )}

                <Button
                  onClick={handleNextStep}
                  disabled={currentStepIndex === currentLesson.steps.length - 1}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lesson Complete */}
      {currentStepIndex === currentLesson.steps.length - 1 &&
        completedSteps.has(currentStep?.id || '') && (
          <Card className="bg-green-500/20 border-green-500/30">
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-400 mb-2">Lesson Complete!</h3>
              <p className="text-green-300 mb-4">
                You've successfully completed "{currentLesson.title}"
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="border-green-500 text-green-400"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart Lesson
                </Button>
                <Button
                  onClick={() => setCurrentLesson(null)}
                  className="bg-gradient-to-r from-green-500 to-green-600"
                >
                  Choose Next Lesson
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
