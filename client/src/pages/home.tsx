import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Shield, Sword, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-yellow-400">Hnefatafl</h1>
              <p className="text-sm text-gray-400">Viking Chess</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-300">Online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Crown className="w-12 h-12 text-yellow-900" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Viking Chess
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience the ancient Norse strategy game Hnefatafl. Lead your Viking warriors in epic battles 
              where tactics and strategy determine the fate of kingdoms.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/lobby">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-8 py-3">
                  <Zap className="w-5 h-5 mr-2" />
                  Quick Match
                </Button>
              </Link>
              <Link href="/lobby">
                <Button size="lg" variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-yellow-900 px-8 py-3">
                  <Users className="w-5 h-5 mr-2" />
                  Join Lobby
                </Button>
              </Link>
            </div>
          </div>

          {/* Game Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-400">
                  <Crown className="w-6 h-6 mr-2" />
                  The King
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Command the mighty King piece. Your goal as defenders is to escort the King 
                  to safety at the edge of the battlefield.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-400">
                  <Shield className="w-6 h-6 mr-2" />
                  Defenders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Loyal warriors who protect the King. Use strategy and teamwork 
                  to create a path to victory through enemy lines.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-red-400">
                  <Sword className="w-6 h-6 mr-2" />
                  Attackers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Fierce raiders seeking to capture the King. Surround and overwhelm 
                  the defenders with superior numbers and tactical positioning.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Game Rules */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-yellow-400">How to Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">Victory Conditions</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <Crown className="w-4 h-4 mr-2 mt-1 text-yellow-400" />
                      <span><strong>Defenders Win:</strong> Get the King to any edge square</span>
                    </li>
                    <li className="flex items-start">
                      <Sword className="w-4 h-4 mr-2 mt-1 text-red-400" />
                      <span><strong>Attackers Win:</strong> Capture the King by surrounding it</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-3">Basic Rules</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Pieces move like chess rooks (straight lines only)</li>
                    <li>• Capture by surrounding enemy pieces</li>
                    <li>• The King piece has special movement rules</li>
                    <li>• Only the King can occupy the throne square</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/lobby">
                  <Button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900 font-semibold px-8 py-3">
                    Start Playing Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 Viking Chess Hnefatafl. Experience the ancient Norse strategy game.
          </p>
        </div>
      </footer>
    </div>
  );
}
