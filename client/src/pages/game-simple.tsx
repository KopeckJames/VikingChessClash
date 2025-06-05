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

export default function GameSimple() {
  // All hooks at the top - no conditional execution
  const { id } = useParams();
  const [, navigate] = useLocation();
  const gameId = parseInt(id || "0");
  const [showWinnerCard, setShowWinnerCard] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId && !!currentUser,
  });

  const { socket, isConnected } = useWebSocket();
  const { gameState, makeMove, sendChatMessage, latestChatMessage } = useGameState(gameId, socket);

  // Check authentication on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  // Join game room when connected
  useEffect(() => {
    if (socket && gameId && isConnected && currentUser) {
      socket.send({
        type: 'join_game',
        gameId,
        userId: currentUser.id,
      });
    }
  }, [socket, gameId, isConnected, currentUser]);

  // Handle game completion
  useEffect(() => {
    const currentGame = gameState || game;
    const isGameCompleted = currentGame?.status === "completed";
    
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
  }, [gameState, game, showWinnerCard, navigate]);

  // Early returns after all hooks
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-2">Authenticating...</h2>
        </div>
      </div>
    );
  }

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
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Viking Chess Battle</h1>
              <p className="text-gray-400">Game #{currentGame.id}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isGameActive ? "default" : "secondary"} className="bg-yellow-600 text-black">
                {isGameActive ? "Active" : isWaitingForOpponent ? "Waiting" : "Completed"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                    Battle of Hnefatafl
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">{currentGame.timeControl}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isPlayerTurn ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {isPlayerTurn ? 'Your Turn' : 'Opponent\'s Turn'}
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
                variant="outline" 
                className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
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
                    <div className="text-xs text-blue-400 mt-1">12 + King</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-600">
                  <div className="flex justify-between items-center">
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