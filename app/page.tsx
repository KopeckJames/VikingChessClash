'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen aaa-background relative overflow-hidden">
      {/* Cinematic Light Rays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-amber-400/20 via-transparent to-transparent transform rotate-12 animate-pulse"></div>
        <div
          className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-blue-400/20 via-transparent to-transparent transform -rotate-12 animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>
      {/* AAA Navigation */}
      <nav className="aaa-nav relative z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 group">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl norse-symbol">ᚠ</span>
              </div>
              <div>
                <span className="text-2xl font-bold aaa-title">HNEFATAFL</span>
                <div className="text-sm aaa-subtitle">Viking Chess Clash</div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/game" className="aaa-button-secondary text-sm px-4 py-2">
                <span className="flex items-center space-x-2">
                  <span>⚔️</span>
                  <span>PLAY</span>
                </span>
              </Link>
              <Link href="/tournaments" className="aaa-button-secondary text-sm px-4 py-2">
                <span className="flex items-center space-x-2">
                  <span>🏆</span>
                  <span>TOURNAMENTS</span>
                </span>
              </Link>
              <Link href="/lobby" className="aaa-button text-sm px-6 py-2">
                <span className="flex items-center space-x-2">
                  <span>🏛️</span>
                  <span>ENTER HALL</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 aaa-card px-6 py-3 rounded-full text-sm font-medium mb-8">
            <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></span>
            <span className="text-amber-200">Ancient Strategy • Epic Experience</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-8">
            <span className="aaa-title bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent norse-symbol">
              ᚺᚾᛖᚠᚨᛏᚨᚠᛚ
            </span>
            <br />
            <span className="text-4xl md:text-6xl text-amber-200 font-semibold">
              VIKING CHESS CLASH
            </span>
          </h1>

          <p className="text-xl text-amber-100 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Enter the legendary realm of Norse strategy where kings must escape and warriors clash
            in epic battles. Experience the ancient Viking board game with stunning cinematic
            visuals, intelligent AI opponents, and seamless multiplayer warfare in a beautifully
            crafted AAA gaming experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/game" className="aaa-button text-xl px-12 py-6">
              <span className="flex items-center space-x-3">
                <span className="text-2xl">⚔️</span>
                <span>BEGIN BATTLE</span>
                <span className="text-2xl">⚔️</span>
              </span>
            </Link>
            <Link href="/game?mode=ai" className="aaa-button-secondary text-xl px-12 py-6">
              <span className="flex items-center space-x-3">
                <span className="text-2xl">🤖</span>
                <span>CHALLENGE AI</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Game Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="aaa-card rounded-2xl p-8 hover:scale-105 transition-all duration-300 group">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-3xl">⚔️</span>
            </div>
            <h3 className="text-xl font-bold text-amber-200 mb-3">QUICK BATTLE</h3>
            <p className="text-amber-100/80 mb-6">
              Enter the battlefield instantly with our intelligent matchmaking system.
            </p>
            <Link href="/game" className="aaa-button-secondary text-sm px-4 py-2 inline-block">
              ENTER BATTLE →
            </Link>
          </div>

          <div className="aaa-card rounded-2xl p-8 hover:scale-105 transition-all duration-300 group">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-amber-200 mb-3">AI CHALLENGE</h3>
            <p className="text-amber-100/80 mb-6">
              Test your strategic prowess against advanced AI with multiple difficulty levels.
            </p>
            <Link
              href="/game?mode=ai"
              className="aaa-button-secondary text-sm px-4 py-2 inline-block"
            >
              CHALLENGE AI →
            </Link>
          </div>

          <div className="aaa-card rounded-2xl p-8 hover:scale-105 transition-all duration-300 group">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-3xl">🏛️</span>
            </div>
            <h3 className="text-xl font-bold text-amber-200 mb-3">MULTIPLAYER HALL</h3>
            <p className="text-amber-100/80 mb-6">
              Battle warriors worldwide in real-time multiplayer combat.
            </p>
            <Link href="/lobby" className="aaa-button-secondary text-sm px-4 py-2 inline-block">
              ENTER HALL →
            </Link>
          </div>

          <div className="aaa-card rounded-2xl p-8 hover:scale-105 transition-all duration-300 group">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-3xl">🏆</span>
            </div>
            <h3 className="text-xl font-bold text-amber-200 mb-3">TOURNAMENTS</h3>
            <p className="text-amber-100/80 mb-6">
              Compete in epic tournaments and ascend the global leaderboard.
            </p>
            <Link
              href="/tournaments"
              className="aaa-button-secondary text-sm px-4 py-2 inline-block"
            >
              VIEW EVENTS →
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="aaa-card rounded-3xl p-12 mb-20 relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-700/10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl"></div>

          <div className="text-center mb-12 relative z-10">
            <h2 className="aaa-title text-4xl font-bold mb-4">⚡ EPIC FEATURES</h2>
            <p className="text-xl text-amber-200">
              Experience ancient Norse strategy with cutting-edge AAA technology
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-blue-400/30">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="font-semibold text-amber-200 mb-2">MOBILE READY</h3>
              <p className="text-sm text-amber-100/70">Optimized for all devices</p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-purple-400/30">
                <span className="text-4xl">⚡</span>
              </div>
              <h3 className="font-semibold text-amber-200 mb-2">REAL-TIME</h3>
              <p className="text-sm text-amber-100/70">Instant multiplayer action</p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-green-400/30">
                <span className="text-4xl">🧠</span>
              </div>
              <h3 className="font-semibold text-amber-200 mb-2">SMART AI</h3>
              <p className="text-sm text-amber-100/70">Advanced algorithms</p>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-orange-400/30">
                <span className="text-4xl">♿</span>
              </div>
              <h3 className="font-semibold text-amber-200 mb-2">ACCESSIBLE</h3>
              <p className="text-sm text-amber-100/70">Inclusive design</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="aaa-card rounded-3xl p-12 bg-gradient-to-r from-amber-900/20 to-amber-700/20 relative overflow-hidden">
            {/* Epic background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-amber-900/20 pointer-events-none"></div>
            <div
              className="absolute top-0 left-0 w-full h-full bg-[conic-gradient(from_0deg,transparent,rgba(212,175,55,0.05),transparent)] animate-spin pointer-events-none"
              style={{ animationDuration: '20s' }}
            ></div>

            <div className="relative z-10">
              <h2 className="aaa-title text-4xl font-bold mb-6">🏰 READY TO ENTER VALHALLA? 🏰</h2>
              <p className="text-xl text-amber-200 mb-8 max-w-2xl mx-auto">
                Join thousands of warriors in the ultimate Norse strategy experience. Your legend
                awaits in the halls of Hnefatafl!
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/game" className="aaa-button text-xl px-12 py-6">
                  <span className="flex items-center space-x-3">
                    <span className="text-2xl">⚔️</span>
                    <span>BEGIN YOUR SAGA</span>
                    <span className="text-2xl">⚔️</span>
                  </span>
                </Link>
                <div className="flex items-center space-x-2 text-amber-300">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium">SERVERS ONLINE • WARRIORS READY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
