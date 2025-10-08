'use client'

export default function LobbyPage() {
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
              <a href="/tournaments" className="aaa-button-secondary text-sm px-4 py-2">
                <span className="flex items-center space-x-2">
                  <span>🏆</span>
                  <span>TOURNAMENTS</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12">
          <h1 className="aaa-title text-5xl font-bold mb-6">🏛️ WARRIOR'S HALL 🏛️</h1>
          <p className="text-xl text-amber-200 mb-8">
            Enter the great hall where warriors gather for epic multiplayer battles!
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aaa-card p-8 rounded-2xl relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-blue-700/10 pointer-events-none"></div>

              <h3 className="aaa-title text-2xl font-bold mb-6 relative z-10">⚔️ ACTIVE BATTLES</h3>
              <div className="space-y-4 relative z-10">
                <div className="aaa-status p-4 rounded-xl border border-blue-400/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-amber-200">🛡️ Ragnar vs 🗡️ Bjorn</div>
                      <div className="text-sm text-amber-100/70">Epic battle in progress</div>
                    </div>
                    <button className="aaa-button-secondary text-sm px-4 py-2">SPECTATE</button>
                  </div>
                </div>
                <div className="aaa-status p-4 rounded-xl border border-blue-400/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-amber-200">
                        👑 VikingMaster vs ⚔️ ChessKing
                      </div>
                      <div className="text-sm text-amber-100/70">Throne under siege</div>
                    </div>
                    <button className="aaa-button-secondary text-sm px-4 py-2">SPECTATE</button>
                  </div>
                </div>
                <div className="aaa-status aaa-status-active p-4 rounded-xl border border-green-400/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-green-200">🏰 StrategicWarrior</div>
                      <div className="text-sm text-green-100/70 animate-pulse">
                        Awaiting challenger...
                      </div>
                    </div>
                    <button className="aaa-button text-sm px-6 py-2">JOIN BATTLE</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="aaa-card p-8 rounded-2xl relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-700/10 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl"></div>

              <h3 className="aaa-title text-2xl font-bold mb-6 relative z-10">
                🏰 FORGE NEW BATTLE
              </h3>
              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-sm font-bold text-amber-200 mb-3">
                    ⏰ TIME CONTROL
                  </label>
                  <select className="aaa-input w-full">
                    <option>5+3 (5 min + 3 sec increment)</option>
                    <option>10+5 (10 min + 5 sec increment)</option>
                    <option>15+10 (15 min + 10 sec increment)</option>
                    <option>30+0 (30 min no increment)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-200 mb-3">
                    ⚔️ YOUR ROLE
                  </label>
                  <select className="aaa-input w-full">
                    <option>🎲 Random Assignment</option>
                    <option>🛡️ Defender (Protect the King)</option>
                    <option>⚔️ Attacker (Siege the Throne)</option>
                  </select>
                </div>
                <button className="aaa-button w-full text-lg py-4">
                  <span className="flex items-center justify-center space-x-3">
                    <span className="text-2xl">🏰</span>
                    <span>CREATE BATTLE</span>
                    <span className="text-2xl">🏰</span>
                  </span>
                </button>
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
