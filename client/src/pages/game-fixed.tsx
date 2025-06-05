import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  const [, navigate] = useLocation();
  const gameId = parseInt(id || "0");
  const [showWinnerCard, setShowWinnerCard] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  // Check if user is authenticated - moved all hooks before conditional returns
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId && !!currentUser,
  });

  const { socket, isConnected } = useWebSocket();
  const { gameState, makeMove, sendChatMessage, latestChatMessage } = useGameState(gameId, socket);

  // Move authentication check after all hooks
  if (!currentUser) {
    navigate("/auth");
    return null;
  }

  useEffect(() => {
    if (socket && gameId && isConnected) {
      // Join the game room
      socket.send({
        type: 'join_game',
        gameId,
        userId: currentUser.id,
      });
    }
  }, [socket, gameId, isConnected, currentUser.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Battle...</h2>
          <p className="text-gray-400">Preparing the battlefield</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
          <p className="text-gray-400 mb-6">This battle does not exist or has been removed</p>
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
  const userId = currentUser.id;
  const userRole = currentGame?.hostId === userId ? currentGame?.hostRole : 
                   (currentGame?.hostRole === "defender" ? "attacker" : "defender");
  const isPlayerTurn = (currentGame?.currentPlayer === "defender" && userRole === "defender") ||
                       (currentGame?.currentPlayer === "attacker" && userRole === "attacker");
  const isGameActive = currentGame?.status === "active";
  const isWaitingForOpponent = currentGame?.status === "waiting";
  const isGameCompleted = currentGame?.status === "completed";

  // Handle game completion with winner card and timer
  useEffect(() => {
    if (isGameCompleted && !showWinnerCard) {
      setShowWinnerCard(true);
      setCountdown(5);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/lobby");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isGameCompleted, showWinnerCard, navigate]);

  return (
    <div className="min-h-screen relative">
      {/* Winner Card Overlay */}
      {showWinnerCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <Card className="w-96 bg-slate-900 border-2 border-yellow-400 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                {currentGame?.winnerId === userId ? (
                  <>
                    <div className="text-8xl mb-4">👑</div>
                    <h1 className="text-4xl font-bold text-yellow-400 mb-2">VICTORY!</h1>
                    <p className="text-xl text-gray-300">You have won the battle!</p>
                  </>
                ) : (
                  <>
                    <div className="text-8xl mb-4">⚔️</div>
                    <h1 className="text-4xl font-bold text-red-400 mb-2">DEFEAT</h1>
                    <p className="text-xl text-gray-300">Your opponent has triumphed</p>
                  </>
                )}
              </div>
              
              <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-600">
                <div className="text-sm text-gray-400 mb-1">Game Result</div>
                <div className="text-lg font-medium text-yellow-400">
                  {currentGame?.winCondition === "king_escape" ? "King Escaped to Corner" :
                   currentGame?.winCondition === "king_captured" ? "King Was Captured" :
                   "Game Completed"}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-2xl font-bold text-white mb-2">
                  Returning to lobby in
                </div>
                <div className="text-6xl font-bold text-yellow-400">
                  {countdown}
                </div>
              </div>
              
              <Button 
                onClick={() => navigate("/lobby")}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-8"
              >
                Return Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/lobby">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lobby
              </Button>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-white font-semibold">Viking Chess</span>
              </div>
              
              <div className="text-sm text-gray-400">
                Playing as: <span className="text-white">{currentUser.displayName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="xl:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
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
                    <span className="text-sm text-gray-400">
                      Move {((currentGame?.moveHistory as any[])?.length || 0) + 1}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isWaitingForOpponent ? (
                  <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-lg">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                      <h3 className="text-xl font-bold text-yellow-400 mb-2">Waiting for Opponent</h3>
                      <p className="text-gray-400 mb-4">Share this game link or wait for someone to join from the lobby</p>
                      <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                        <div className="text-sm text-gray-300 mb-1">Game ID:</div>
                        <div className="text-lg font-mono text-yellow-400">#{currentGame.id}</div>
                      </div>
                    </div>
                  </div>
                ) : isGameCompleted ? (
                  <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-lg">
                    <div className="text-center max-w-md">
                      <div className="mb-6">
                        {currentGame.winnerId === userId ? (
                          <div className="text-6xl mb-4">👑</div>
                        ) : (
                          <div className="text-6xl mb-4">⚔️</div>
                        )}
                      </div>
                      
                      <h2 className="text-3xl font-bold mb-4">
                        {currentGame.winnerId === userId ? (
                          <span className="text-yellow-400">Victory!</span>
                        ) : (
                          <span className="text-red-400">Defeat</span>
                        )}
                      </h2>
                      
                      <div className="space-y-4 mb-6">
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                          <h3 className="text-lg font-semibold text-gray-200 mb-3">Game Results</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-400">Winner</div>
                              <div className="text-yellow-400 font-medium">
                                {currentGame.winnerId === currentGame.hostId ? 
                                  `Host (${currentGame.hostRole})` : 
                                  `Guest (${currentGame.hostRole === "defender" ? "attacker" : "defender"})`}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">Win Condition</div>
                              <div className="text-gray-200">
                                {currentGame.winCondition === "king_escape" ? "King Escaped" :
                                 currentGame.winCondition === "king_captured" ? "King Captured" :
                                 currentGame.winCondition || "Game Completed"}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                          <h3 className="text-lg font-semibold text-gray-200 mb-3">All Players</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Host ({currentGame.hostRole})</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                currentGame.winnerId === currentGame.hostId ? 
                                'bg-yellow-400 text-black' : 'bg-gray-600 text-gray-300'
                              }`}>
                                {currentGame.winnerId === currentGame.hostId ? 'Winner' : 'Player'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">
                                Guest ({currentGame.hostRole === "defender" ? "attacker" : "defender"})
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                currentGame.winnerId === currentGame.guestId ? 
                                'bg-yellow-400 text-black' : 'bg-gray-600 text-gray-300'
                              }`}>
                                {currentGame.winnerId === currentGame.guestId ? 'Winner' : 'Player'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 justify-center">
                        <Link href="/lobby">
                          <Button className="bg-yellow-600 hover:bg-yellow-700 text-black">
                            Return to Lobby
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => window.location.reload()}
                        >
                          View Final Board
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <GameBoard 
                    game={currentGame} 
                    onMove={makeMove}
                    isPlayerTurn={isPlayerTurn}
                    userRole={userRole as "attacker" | "defender"}
                  />
                )}
              </CardContent>
            </Card>

            {/* Game Controls */}
            <div className="flex gap-4 mt-6">
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
            {/* Game Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                  Battle Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                    <div className="flex items-center justify-center mb-2">
                      <Sword className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-sm text-red-300 font-medium">Attackers</div>
                    <div className="text-xs text-red-400 mt-1">24 pieces</div>
                  </div>
                  <div className="text-center p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                    <div className="flex items-center justify-center mb-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-sm text-blue-300 font-medium">Defenders</div>
                    <div className="text-xs text-blue-400 mt-1">12 pieces + King</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white capitalize">{currentGame.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Control:</span>
                    <span className="text-white">{currentGame.timeControl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Role:</span>
                    <span className="text-white capitalize">{userRole}</span>
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