import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, TrendingUp, Flame, Crown, Medal, Award, ArrowLeft, Users, Star, Swords } from "lucide-react";
import RatingBadge from "@/components/rating-badge";
import BreadcrumbNav from "@/components/breadcrumb-nav";
import LogoutButton from "@/components/logout-button";
import { updateSEO, seoPages } from "@/lib/seo";
import { analytics } from "@/lib/analytics";
import { useEffect } from "react";

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

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");

  useEffect(() => {
    updateSEO({
      title: "Valhalla Leaderboard | Viking Chess Champions Hall of Fame",
      description: "Witness the greatest Viking Chess warriors in Valhalla's Hall of Fame. View rankings, Norse titles, and legendary achievements.",
      keywords: "viking chess leaderboard, hnefatafl rankings, norse champions, hall of fame, viking warriors",
      canonical: "/leaderboard"
    });
    analytics.trackPageView("/leaderboard", "Valhalla Leaderboard");
  }, []);

  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["/api/leaderboard", period],
    enabled: true,
  });

  const users = (leaderboard as LeaderboardUser[]) || [];
  const currentUserRank = currentUser ? users.findIndex(user => user.id === currentUser.id) + 1 : 0;

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-gray-500">#{position}</span>;
    }
  };

  const getWinRate = (wins: number, losses: number, draws: number) => {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "week": return "This Week";
      case "month": return "This Month";
      default: return "All Time";
    }
  };

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
                <Trophy className="w-6 h-6 text-yellow-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-yellow-400">Valhalla Leaderboard</h1>
                <p className="text-sm text-gray-400">Hall of Fame - Greatest Vikings</p>
              </div>
            </div>
            
            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-300">{currentUser.displayName}</p>
                  <div className="flex items-center gap-2">
                    <RatingBadge rating={currentUser.rating} size="sm" />
                    {currentUserRank > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Rank #{currentUserRank}
                      </Badge>
                    )}
                  </div>
                </div>
                <LogoutButton size="sm" />
              </div>
            )}
          </div>
          
          <BreadcrumbNav />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-yellow-400">
                    <Trophy className="w-5 h-5 mr-2" />
                    {getPeriodLabel(period)} Champions
                  </CardTitle>
                  <Tabs value={period} onValueChange={(value) => setPeriod(value as any)}>
                    <TabsList className="grid w-full grid-cols-3 bg-white/10">
                      <TabsTrigger value="all" className="text-xs">All Time</TabsTrigger>
                      <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                      <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(15)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg animate-pulse">
                        <div className="w-12 h-12 bg-white/10 rounded-lg" />
                        <div className="flex-1">
                          <div className="w-32 h-5 bg-white/10 rounded mb-2" />
                          <div className="w-24 h-3 bg-white/10 rounded" />
                        </div>
                        <div className="w-24 h-8 bg-white/10 rounded" />
                      </div>
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Champions Yet</h3>
                    <p>The halls of Valhalla await the first warriors.</p>
                    <p className="text-sm">Be the first to claim glory!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user, index) => {
                      const position = index + 1;
                      const winRate = getWinRate(user.wins, user.losses, user.draws);
                      const isCurrentUser = user.id === currentUser?.id;
                      
                      return (
                        <div 
                          key={user.id} 
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:bg-white/10 ${
                            position <= 3 
                              ? 'bg-gradient-to-r from-yellow-500/15 to-transparent border border-yellow-500/30' 
                              : isCurrentUser
                              ? 'bg-gradient-to-r from-blue-500/15 to-transparent border border-blue-500/30'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg">
                            {getPositionIcon(position)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`font-bold text-lg truncate ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                                {user.displayName}
                                {isCurrentUser && <span className="text-sm font-normal text-blue-300 ml-2">(You)</span>}
                              </span>
                              {user.winStreak >= 3 && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded-full text-orange-400 text-xs font-semibold">
                                  <Flame className="w-3 h-3" />
                                  {user.winStreak} streak
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Swords className="w-3 h-3" />
                                {user.gamesPlayed} games
                              </span>
                              <span>{winRate}% win rate</span>
                              <span>{user.wins}W {user.losses}L {user.draws}D</span>
                              {user.bestRating > user.rating && (
                                <span className="flex items-center gap-1 text-yellow-400">
                                  <TrendingUp className="w-3 h-3" />
                                  Peak: {user.bestRating}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <RatingBadge rating={user.rating} size="md" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Statistics */}
          <div className="space-y-6">
            {/* Top Statistics */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-400">
                  <Star className="w-5 h-5 mr-2" />
                  Hall Records
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.length > 0 && (
                  <>
                    <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-lg border border-yellow-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-semibold text-yellow-400">Highest Rating</span>
                      </div>
                      <p className="font-bold text-white">{Math.max(...users.map(u => u.bestRating || u.rating))}</p>
                      <p className="text-xs text-gray-400">
                        {users.find(u => (u.bestRating || u.rating) === Math.max(...users.map(u => u.bestRating || u.rating)))?.displayName}
                      </p>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-orange-500/20 to-transparent rounded-lg border border-orange-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-semibold text-orange-400">Longest Streak</span>
                      </div>
                      <p className="font-bold text-white">{Math.max(...users.map(u => u.winStreak || 0))} wins</p>
                      <p className="text-xs text-gray-400">
                        {users.find(u => u.winStreak === Math.max(...users.map(u => u.winStreak || 0)))?.displayName}
                      </p>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-green-500/20 to-transparent rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Best Win Rate</span>
                      </div>
                      <p className="font-bold text-white">
                        {Math.max(...users.filter(u => u.gamesPlayed >= 5).map(u => getWinRate(u.wins, u.losses, u.draws)))}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {users.filter(u => u.gamesPlayed >= 5)
                          .find(u => getWinRate(u.wins, u.losses, u.draws) === 
                            Math.max(...users.filter(u => u.gamesPlayed >= 5).map(u => getWinRate(u.wins, u.losses, u.draws))))?.displayName}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-400">
                  <Swords className="w-5 h-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/lobby">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <Users className="w-4 h-4 mr-2" />
                    Return to Lobby
                  </Button>
                </Link>
                <Link href="/game/create">
                  <Button variant="outline" className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                    <Crown className="w-4 h-4 mr-2" />
                    Challenge Champions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}