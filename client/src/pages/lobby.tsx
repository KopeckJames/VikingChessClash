import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Crown, Plus, Zap, Users, Clock, Star } from "lucide-react";
import LobbyList from "@/components/lobby-list";

type WaitingGame = {
  id: number;
  hostName: string;
  hostRating: number;
  timeControl: string;
  status: string;
  hostRole: string;
};

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    hostRole: "defender",
    timeControl: "15+10",
  });

  // Check if user is authenticated
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  
  useEffect(() => {
    if (!currentUser) {
      setLocation("/auth");
    }
  }, [currentUser, setLocation]);

  if (!currentUser) {
    return null;
  }

  const { data: waitingGames = [], isLoading } = useQuery<WaitingGame[]>({
    queryKey: ['/api/games/waiting'],
    refetchInterval: 2000, // Refresh every 2 seconds for better responsiveness
    staleTime: 0, // Always consider data stale to ensure fresh updates
  });

  const { data: userStats } = useQuery<{ totalUsers: number; onlineUsers: number; offlineUsers: number }>({
    queryKey: ['/api/users/stats'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const createGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest('POST', '/api/games/create', {
        hostId: currentUser.id,
        boardState: [], // Will be populated by server
        ...gameData,
      });
      return response.json();
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games/waiting'] });
      setLocation(`/game/${game.id}`);
      toast({
        title: "Game Created",
        description: "Waiting for an opponent to join your battle!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await apiRequest('POST', `/api/games/${gameId}/join`, {
        userId: currentUser.id,
      });
      return response.json();
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games/waiting'] });
      setLocation(`/game/${game.id}`);
      toast({
        title: "Joined Game",
        description: "Successfully joined the game!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGame = () => {
    createGameMutation.mutate(gameSettings);
    setIsCreating(false);
  };

  const handleJoinGame = (gameId: number) => {
    joinGameMutation.mutate(gameId);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-yellow-400">Game Lobby</h1>
              <p className="text-sm text-gray-400">Find opponents and create games</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Welcome, {currentUser.displayName}</span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {currentUser.displayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-yellow-900" />
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">Create Game</h3>
                    <p className="text-sm text-gray-400">Set up a new battle and wait for challengers</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-yellow-400">Create New Game</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role" className="text-gray-300">Your Role</Label>
                    <Select value={gameSettings.hostRole} onValueChange={(value) => setGameSettings(prev => ({ ...prev, hostRole: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defender">Defender (Protect the King)</SelectItem>
                        <SelectItem value="attacker">Attacker (Capture the King)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeControl" className="text-gray-300">Time Control</Label>
                    <Select value={gameSettings.timeControl} onValueChange={(value) => setGameSettings(prev => ({ ...prev, timeControl: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5+3">5+3 minutes (Blitz)</SelectItem>
                        <SelectItem value="10+5">10+5 minutes (Rapid)</SelectItem>
                        <SelectItem value="15+10">15+10 minutes (Standard)</SelectItem>
                        <SelectItem value="30+20">30+20 minutes (Classical)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleCreateGame} className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900" disabled={createGameMutation.isPending}>
                      {createGameMutation.isPending ? "Creating..." : "Create Game"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)} className="border-gray-600">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="bg-white/5 backdrop-blur-lg border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Quick Match</h3>
                <p className="text-sm text-gray-400">Get matched instantly with a player of similar skill</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">Your Stats</h3>
                <p className="text-sm text-gray-400">
                  Rating: <span className="text-xl font-bold text-green-400">{currentUser.rating}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentUser.wins}W - {currentUser.losses}L
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Vikings Online</h3>
                {userStats ? (
                  <div className="space-y-2">
                    <div className="flex justify-center items-center space-x-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-lg font-bold text-green-400">{userStats.onlineUsers}</span>
                        </div>
                        <p className="text-xs text-gray-400">Online</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-lg font-bold text-gray-400">{userStats.offlineUsers}</span>
                        </div>
                        <p className="text-xs text-gray-400">Offline</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Total: {userStats.totalUsers} Vikings
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Loading stats...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Available Games */}
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-400">
                <Crown className="w-6 h-6 mr-2" />
                Available Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading games...</p>
                </div>
              ) : waitingGames.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No games available right now</p>
                  <Button 
                    onClick={() => setIsCreating(true)}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-yellow-900"
                  >
                    Create the First Game
                  </Button>
                </div>
              ) : (
                <LobbyList games={waitingGames} onJoinGame={handleJoinGame} isJoining={joinGameMutation.isPending} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
