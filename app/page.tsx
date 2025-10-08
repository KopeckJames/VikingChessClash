import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🛡️ Viking Chess Clash</h1>
        <p className="text-xl text-gray-600 mb-8">
          Advanced Hnefatafl (Viking Chess) with AI opponents, tournaments, and multiplayer battles
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">🤖 Play vs AI</h2>
            <p className="text-gray-600 mb-4">
              Challenge intelligent AI opponents with different difficulty levels and playing
              styles.
            </p>
            <Link
              href="/game/ai"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start AI Game
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">⚔️ Multiplayer</h2>
            <p className="text-gray-600 mb-4">
              Battle other players in real-time multiplayer matches with live chat and spectating.
            </p>
            <Link
              href="/lobby"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Join Lobby
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">🎯 Practice Game</h2>
            <p className="text-gray-600 mb-4">
              Play a local game to learn the rules and practice your strategy.
            </p>
            <Link
              href="/game"
              className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Start Practice
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">🏆 Tournaments</h2>
            <p className="text-gray-600 mb-4">
              Compete in tournaments, climb the leaderboard, and earn achievements.
            </p>
            <Link
              href="/tournaments"
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Tournaments
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-semibold mb-4">🎯 Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl mb-2">📱</div>
              <p className="text-sm">Mobile Optimized</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌐</div>
              <p className="text-sm">Offline Play</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎨</div>
              <p className="text-sm">Customizable</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">♿</div>
              <p className="text-sm">Accessible</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/api/health" className="text-sm text-gray-500 hover:text-gray-700">
            System Status
          </Link>
        </div>
      </div>
    </div>
  )
}
