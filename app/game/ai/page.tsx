'use client'

import { useState } from 'react'
import Link from 'next/link'

type AILevel = 'easy' | 'medium' | 'hard'
type PlayerRole = 'attacker' | 'defender'

export default function AIGamePage() {
  const [selectedLevel, setSelectedLevel] = useState<AILevel>('medium')
  const [selectedRole, setSelectedRole] = useState<PlayerRole>('attacker')

  const aiLevels = [
    {
      id: 'easy' as AILevel,
      name: 'Novice',
      description: 'Perfect for learning the game',
      color: 'from-green-500 to-emerald-600',
      icon: '🌱',
    },
    {
      id: 'medium' as AILevel,
      name: 'Strategist',
      description: 'Balanced challenge for most players',
      color: 'from-blue-500 to-cyan-600',
      icon: '⚡',
    },
    {
      id: 'hard' as AILevel,
      name: 'Grandmaster',
      description: 'Ultimate test of skill',
      color: 'from-purple-500 to-violet-600',
      icon: '🔥',
    },
  ]

  const roles = [
    {
      id: 'attacker' as PlayerRole,
      name: 'Attacker',
      description: 'Surround and capture the king',
      color: 'from-red-500 to-rose-600',
      icon: '⚔️',
      objective: 'Capture the king by surrounding it on all four sides',
    },
    {
      id: 'defender' as PlayerRole,
      name: 'Defender',
      description: 'Protect the king and help it escape',
      color: 'from-blue-500 to-indigo-600',
      icon: '🛡️',
      objective: 'Help the king reach any corner of the board',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="glass-card rounded-none border-0 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold gradient-text">Viking Chess</span>
            </Link>
            <Link href="/" className="modern-button-secondary text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            <span>AI Challenge Mode</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Challenge the</span>
            <br />
            <span className="text-gray-800">AI Masters</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Test your strategic prowess against our advanced AI opponents. Choose your difficulty
            and role to begin your journey.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* AI Level Selection */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              Choose Your Opponent
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiLevels.map(level => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`glass-card rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 ${
                    selectedLevel === level.id
                      ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105'
                      : 'hover:shadow-xl'
                  }`}
                >
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${level.color} rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl`}
                  >
                    {level.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{level.name}</h3>
                  <p className="text-gray-600 mb-4">{level.description}</p>
                  {selectedLevel === level.id && (
                    <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Selected</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Choose Your Side</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`glass-card rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 ${
                    selectedRole === role.id
                      ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105'
                      : 'hover:shadow-xl'
                  }`}
                >
                  <div
                    className={`w-24 h-24 bg-gradient-to-br ${role.color} rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl`}
                  >
                    {role.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{role.name}</h3>
                  <p className="text-gray-600 mb-4">{role.description}</p>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700 font-medium">Objective:</p>
                    <p className="text-sm text-gray-600">{role.objective}</p>
                  </div>
                  {selectedRole === role.id && (
                    <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Selected</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Game Setup Summary */}
          <div className="glass-card rounded-3xl p-8 mb-12 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Game Setup</h3>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="font-semibold text-gray-800">AI Opponent</p>
                    <p className="text-gray-600">
                      {aiLevels.find(l => l.id === selectedLevel)?.name}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block w-px h-12 bg-gray-300"></div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{roles.find(r => r.id === selectedRole)?.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">Your Role</p>
                    <p className="text-gray-600">{roles.find(r => r.id === selectedRole)?.name}</p>
                  </div>
                </div>
              </div>

              <Link
                href={`/game?mode=ai&level=${selectedLevel}&role=${selectedRole}`}
                className="modern-button-primary text-lg px-12 py-4 inline-flex items-center space-x-3"
              >
                <span>Start Battle</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Tips Section */}
          <div className="glass-card rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Strategy Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-red-600 mb-3 flex items-center">
                  <span className="mr-2">⚔️</span>
                  Attacker Strategy
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Control the center and limit the king's movement
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Use your numerical advantage to create threats
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Coordinate pieces to surround the king
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-blue-600 mb-3 flex items-center">
                  <span className="mr-2">🛡️</span>
                  Defender Strategy
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Create escape routes for the king early
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Use defenders to block attacker advances
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Move the king toward the nearest corner
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
