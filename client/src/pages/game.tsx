import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, Shield, Sword, Clock, Flag, Handshake, MessageCircle } from "lucide-react";
import GameBoard from "@/components/game-board";
import Chat from "@/components/chat";
import { useWebSocket } from "@/hooks/use-websocket";
import { useGameState } from "@/hooks/use-game-state";
import type { Game } from "@shared/schema";

export default function Game() {
  const { id } = useParams();
  const gameId = parseInt(id || "0");
  
  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });

  const { socket, isConnected } = useWebSocket();
  const { gameState, makeMove, sendChatMessage, latestChatMessage } = useGameState(gameId, socket);

  useEffect(() => {
    if (socket && gameId && isConnected) {
      // Join the game room
      socket.send({
        type: 'join_game',
        gameId,
        userId: 1, // Mock user ID
      });
    }
  }, [socket, gameId, isConnected]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-300 mb-2">Game Not Found</h1>
          <p className="text-gray-400 mb-4">The game you're looking for doesn't exist.</p>
          <Link href="/lobby">
            <Button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900">
              Back to Lobby
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentGame = gameState || game;
  const userId = 1; // Mock user ID - in production this would come from auth
  const userRole = currentGame?.hostId === userId ? currentGame?.hostRole : 
                   (currentGame?.hostRole === "defender" ? "attacker" : "defender");
  const isPlayerTurn = (currentGame?.currentPlayer === "defender" && userRole === "defender") ||
                       (currentGame?.currentPlayer === "attacker" && userRole === "attacker");
  const isGameActive = currentGame?.status === "active";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/lobby">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-yellow-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-yellow-400">Game #{gameId}</h1>
                <div className="flex items-center space-x-2">
                  <Badge variant={isGameActive ? "default" : "secondary"} className="text-xs">
                    {currentGame.status}
                  </Badge>
                  {isConnected ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-400">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-xs text-gray-400">Connecting...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-bold text-yellow-400">12:34</div>
                <div className="text-xs text-gray-400">Time left</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Layout */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Game Board Section */}
          <div className="lg:col-span-3">
            <Card className="bg-white/5 backdrop-blur-lg border-white/10 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Current Player Indicator */}
                    <div className="flex items-center space-x-2">
                      {currentGame.currentPlayer === "attacker" ? (
                        <>
                          <Sword className="w-5 h-5 text-red-400" />
                          <span className="font-semibold text-red-400">Attackers' Turn</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 text-blue-400" />
                          <span className="font-semibold text-blue-400">Defenders' Turn</span>
                        </>
                      )}
                    </div>
                    
                    {isPlayerTurn && isGameActive && (
                      <Badge variant="default" className="bg-green-600 text-white">
                        Your Turn
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Move 23</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <GameBoard 
                  game={currentGame} 
                  onMove={makeMove}
                  isPlayerTurn={isPlayerTurn}
                  userRole={userRole as "attacker" | "defender"}
                />
              </CardContent>
            </Card>

            {/* Game Controls */}
            <div className="flex gap-4">
              <Button 
                variant="destructive" 
                className="flex-1"
                disabled={!isGameActive}
              >
                <Flag className="w-4 h-4 mr-2" />
                Resign
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-gray-600"
                disabled={!isGameActive}
              >
                <Handshake className="w-4 h-4 mr-2" />
                Offer Draw
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Player Info */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-400">Players</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Opponent */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-500/20">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                    <Sword className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Ragnar Iron</p>
                    <p className="text-xs text-red-300">Attacker • 1650 ELO</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-400">15:42</div>
                    <div className="text-xs text-red-300">Time</div>
                  </div>
                </div>

                {/* Current Player */}
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-500/20">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">You (Erik Bold)</p>
                    <p className="text-xs text-blue-300">Defender • 1420 ELO</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-400">12:18</div>
                    <div className="text-xs text-blue-300">Your time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Statistics */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-400">Game Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">8</div>
                    <div className="text-xs text-blue-300">Defenders</div>
                  </div>
                  <div className="text-center p-3 bg-red-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">18</div>
                    <div className="text-xs text-red-300">Attackers</div>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-500/20 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Crown className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-xs text-yellow-300">King Position</span>
                  </div>
                  <div className="font-bold text-yellow-400">E6</div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-300 text-sm">Victory Conditions</h4>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex items-center">
                      <Shield className="w-3 h-3 mr-2 text-blue-400" />
                      <span>Get King to edge</span>
                    </div>
                    <div className="flex items-center">
                      <Sword className="w-3 h-3 mr-2 text-red-400" />
                      <span>Capture the King</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Chat gameId={gameId} onSendMessage={sendChatMessage} newMessage={latestChatMessage} />
          </div>
        </div>
      </main>
    </div>
  );
}
