export default function LobbyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">⚔️ Multiplayer Lobby</h1>
        <p className="text-gray-600 mb-8">Join or create a game to battle other players!</p>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">🎮 Active Games</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Player123 vs Player456</span>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    Spectate
                  </button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>VikingMaster vs ChessKing</span>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    Spectate
                  </button>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>StrategicPlayer waiting...</span>
                  <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                    Join
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">🆕 Create Game</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Time Control</label>
                  <select className="w-full p-2 border rounded">
                    <option>5+3 (5 min + 3 sec increment)</option>
                    <option>10+5 (10 min + 5 sec increment)</option>
                    <option>15+10 (15 min + 10 sec increment)</option>
                    <option>30+0 (30 min no increment)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Your Role</label>
                  <select className="w-full p-2 border rounded">
                    <option>Random</option>
                    <option>Defender (King's side)</option>
                    <option>Attacker</option>
                  </select>
                </div>
                <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                  Create Game
                </button>
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
