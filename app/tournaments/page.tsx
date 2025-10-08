export default function TournamentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">🏆 Tournaments</h1>
        <p className="text-gray-600 mb-8">Compete in tournaments and climb the leaderboard!</p>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-xl font-semibold mb-4">🎯 Active Tournaments</h3>
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold">Weekly Championship</h4>
                      <p className="text-gray-600">Swiss system, 5 rounds</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      Open
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Players:</span>
                      <div className="font-semibold">24/32</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Time Control:</span>
                      <div className="font-semibold">10+5</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Prize:</span>
                      <div className="font-semibold">🏆 Trophy</div>
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Register
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold">Blitz Arena</h4>
                      <p className="text-gray-600">Fast-paced 3+2 games</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                      Starting Soon
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Players:</span>
                      <div className="font-semibold">16/16</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Time Control:</span>
                      <div className="font-semibold">3+2</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-semibold">1 hour</div>
                    </div>
                  </div>
                  <button className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed">
                    Full
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">📊 Leaderboard</h3>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-2">🥇</span>
                      <span className="font-semibold">VikingKing</span>
                    </div>
                    <span className="text-sm text-gray-600">2150</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">🥈</span>
                      <span className="font-semibold">ChessMaster</span>
                    </div>
                    <span className="text-sm text-gray-600">2089</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-orange-600 mr-2">🥉</span>
                      <span className="font-semibold">StrategicMind</span>
                    </div>
                    <span className="text-sm text-gray-600">2034</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">4.</span>
                      <span>TacticalPlayer</span>
                    </div>
                    <span className="text-sm text-gray-600">1987</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">5.</span>
                      <span>BoardMaster</span>
                    </div>
                    <span className="text-sm text-gray-600">1945</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <button className="w-full text-blue-600 hover:text-blue-800 text-sm">
                    View Full Leaderboard →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
