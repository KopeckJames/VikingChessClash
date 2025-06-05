import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Flame, Crown, Medal, Award } from "lucide-react";
import RatingBadge from "./rating-badge";

interface LeaderboardUser {
  id: number;
  displayName: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winStreak: number;
  bestRating: number;
}

export default function Leaderboard() {
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard", period],
    enabled: true,
  });

  const users = leaderboard as LeaderboardUser[] || [];

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  const getWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-400">
            <Trophy className="w-5 h-5 mr-2" />
            Valhalla Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-white/10 rounded" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-white/10 rounded mb-1" />
                  <div className="w-16 h-3 bg-white/10 rounded" />
                </div>
                <div className="w-20 h-6 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-400">
          <Trophy className="w-5 h-5 mr-2" />
          Valhalla Leaderboard
        </CardTitle>
        <Tabs value={period} onValueChange={(value) => setPeriod(value as any)}>
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger value="all" className="text-xs">All Time</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">This Month</TabsTrigger>
            <TabsTrigger value="week" className="text-xs">This Week</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No warriors have proven themselves yet.</p>
              <p className="text-sm">Be the first to claim glory!</p>
            </div>
          ) : (
            users.map((user, index) => {
              const position = index + 1;
              const winRate = getWinRate(user.wins, user.losses, user.draws);
              
              return (
                <div 
                  key={user.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-white/10 ${
                    position <= 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8">
                    {getPositionIcon(position)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white truncate">{user.displayName}</span>
                      {user.winStreak >= 3 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded text-orange-400 text-xs">
                          <Flame className="w-3 h-3" />
                          {user.winStreak}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{user.gamesPlayed} games</span>
                      <span>{winRate}% win rate</span>
                      {user.bestRating > user.rating && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Best: {user.bestRating}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <RatingBadge rating={user.rating} size="sm" />
                    <div className="text-xs text-gray-400 mt-1">
                      {user.wins}W {user.losses}L {user.draws}D
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}