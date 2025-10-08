'use client'

export default function TournamentsPage() {
  return (
    <div className="min-h-screen aaa-background relative overflow-hidden">
      {/* AAA Navigation */}
      <nav className="aaa-nav relative z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center space-x-4 group">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl norse-symbol">ᚠ</span>
              </div>
              <div>
                <span className="text-2xl font-bold aaa-title">HNEFATAFL</span>
                <div className="text-sm aaa-subtitle">Viking Chess Clash</div>
              </div>
            </a>
            <div className="flex items-center space-x-4">
              <a href="/game" className="aaa-button-secondary text-sm px-4 py-2">
                <span className="flex items-center space-x-2">
                  <span>⚔️</span>
                  <span>QUICK BATTLE</span>
                </span>
              </a>
              <a href="/lobby" className="aaa-button-secondary text-sm px-4 py-2">
                <span className="flex items-center space-x-2">
                  <span>🏛️</span>
                  <span>WARRIOR'S HALL</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12">
          <h1 className="aaa-title text-5xl font-bold mb-6">🏆 TOURNAMENT ARENA 🏆</h1>
          <p className="text-xl text-amber-200 mb-8">
            Compete in epic tournaments and ascend to legendary status!
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="aaa-title text-2xl font-bold mb-6">⚔️ ACTIVE TOURNAMENTS</h3>
              <div className="space-y-6">
                <div className="aaa-card p-8 rounded-2xl relative overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-transparent to-green-700/10 pointer-events-none"></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <h4 className="text-2xl font-bold text-amber-200 mb-2">
                        👑 WEEKLY CHAMPIONSHIP
                      </h4>
                      <p className="text-amber-100/80">Swiss system tournament • 5 epic rounds</p>
                    </div>
                    <span className="aaa-status aaa-status-active px-4 py-2 rounded-full text-sm font-bold">
                      🟢 OPEN
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-sm mb-6 relative z-10">
                    <div className="text-center">
                      <span className="text-amber-100/70 block mb-1">WARRIORS</span>
                      <div className="text-xl font-bold text-amber-200">24/32</div>
                    </div>
                    <div className="text-center">
                      <span className="text-amber-100/70 block mb-1">TIME CONTROL</span>
                      <div className="text-xl font-bold text-amber-200">10+5</div>
                    </div>
                    <div className="text-center">
                      <span className="text-amber-100/70 block mb-1">GLORY</span>
                      <div className="text-xl font-bold text-amber-200">🏆 LEGEND</div>
                    </div>
                  </div>
                  <button className="aaa-button w-full text-lg py-4 relative z-10">
                    <span className="flex items-center justify-center space-x-3">
                      <span className="text-2xl">⚔️</span>
                      <span>JOIN CHAMPIONSHIP</span>
                      <span className="text-2xl">⚔️</span>
                    </span>
                  </button>
                </div>

                <div className="aaa-card p-8 rounded-2xl relative overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-orange-700/10 pointer-events-none"></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <h4 className="text-2xl font-bold text-amber-200 mb-2">⚡ BLITZ ARENA</h4>
                      <p className="text-amber-100/80">Lightning-fast battles • 3+2 time control</p>
                    </div>
                    <span className="aaa-status px-4 py-2 rounded-full text-sm font-bold bg-yellow-600/20 text-yellow-200 border border-yellow-400/30">
                      🟡 STARTING SOON
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-sm mb-6 relative z-10">
                    <div className="text-center">
                      <span className="text-amber-100/70 block mb-1">WARRIORS</span>
                      <div className="text-xl font-bold text-amber-200">16/16</div>
                    </div>
                    <div className="text-center">
                      <span className="text-amber-100/70 block mb-1">TIME CONTROL</span>
                      <div className="text-xl font-bold text-amber-200">3+2</div>
                    </div>
                    <div className="text-center">
                      <span className="text-amber-100/70 block mb-1">DURATION</span>
                      <div className="text-xl font-bold text-amber-200">1 HOUR</div>
                    </div>
                  </div>
                  <button className="aaa-button-secondary w-full text-lg py-4 relative z-10 opacity-50 cursor-not-allowed">
                    <span className="flex items-center justify-center space-x-3">
                      <span className="text-2xl">🔒</span>
                      <span>ARENA FULL</span>
                      <span className="text-2xl">🔒</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="aaa-title text-2xl font-bold mb-6">👑 HALL OF LEGENDS</h3>
              <div className="aaa-card p-8 rounded-2xl relative overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-700/10 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl"></div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-400/30">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">🥇</span>
                      <div>
                        <div className="font-bold text-yellow-200">VikingKing</div>
                        <div className="text-xs text-yellow-100/70">Legendary Warrior</div>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-yellow-200">2150</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-400/20 to-gray-300/20 border border-gray-400/30">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">🥈</span>
                      <div>
                        <div className="font-bold text-gray-200">ChessMaster</div>
                        <div className="text-xs text-gray-100/70">Elite Strategist</div>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-gray-200">2089</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-600/20 to-orange-500/20 border border-orange-400/30">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">🥉</span>
                      <div>
                        <div className="font-bold text-orange-200">StrategicMind</div>
                        <div className="text-xs text-orange-100/70">Master Tactician</div>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-orange-200">2034</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-amber-400/20">
                    <div className="flex items-center space-x-3">
                      <span className="text-amber-300 font-bold">4.</span>
                      <span className="text-amber-200">TacticalPlayer</span>
                    </div>
                    <span className="text-amber-200 font-semibold">1987</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-amber-400/20">
                    <div className="flex items-center space-x-3">
                      <span className="text-amber-300 font-bold">5.</span>
                      <span className="text-amber-200">BoardMaster</span>
                    </div>
                    <span className="text-amber-200 font-semibold">1945</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-amber-400/20 relative z-10">
                  <button className="aaa-button-secondary w-full text-sm py-3">
                    VIEW FULL HALL OF LEGENDS →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a href="/" className="aaa-button-secondary px-8 py-4 inline-block">
            <span className="flex items-center space-x-2">
              <span>🏠</span>
              <span>RETURN TO MAIN HALL</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
