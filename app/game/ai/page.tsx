export default function AIGamePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">🤖 AI Game</h1>
        <p className="text-gray-600 mb-8">Choose your AI opponent and start playing!</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">🟢 Easy</h3>
            <p className="text-gray-600 mb-4">Perfect for beginners learning the game</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Play Easy
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">🟡 Medium</h3>
            <p className="text-gray-600 mb-4">Balanced challenge for intermediate players</p>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
              Play Medium
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">🔴 Hard</h3>
            <p className="text-gray-600 mb-4">Expert level AI for experienced players</p>
            <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Play Hard
            </button>
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
