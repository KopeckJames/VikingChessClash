import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Crown, Shield, Sword, Star, User, Zap } from "lucide-react";

interface Game {
  id: number;
  hostName: string;
  hostRating: number;
  timeControl: string;
  status: string;
  hostRole: string;
}

interface LobbyListProps {
  games: Game[];
  onJoinGame: (gameId: number) => void;
  isJoining: boolean;
}

export default function LobbyList({ games, onJoinGame, isJoining }: LobbyListProps) {
  const getHostRoleIcon = (role: string) => {
    return role === "defender" ? (
      <Shield className="w-4 h-4 text-blue-400" />
    ) : (
      <Sword className="w-4 h-4 text-red-400" />
    );
  };

  const getHostRoleColor = (role: string) => {
    return role === "defender" ? "from-blue-500/20 to-blue-600/20" : "from-red-500/20 to-red-600/20";
  };

  const getPlayerInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 1600) return "text-yellow-400";
    if (rating >= 1400) return "text-green-400";
    if (rating >= 1200) return "text-blue-400";
    return "text-gray-400";
  };

  const getTimeControlBadge = (timeControl: string) => {
    if (timeControl.includes("5+")) return { variant: "destructive", label: "Blitz" };
    if (timeControl.includes("10+")) return { variant: "default", label: "Rapid" };
    if (timeControl.includes("15+")) return { variant: "secondary", label: "Standard" };
    return { variant: "outline", label: "Classical" };
  };

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const timeControlBadge = getTimeControlBadge(game.timeControl);
        
        return (
          <div
            key={game.id}
            className={`bg-gradient-to-br ${getHostRoleColor(game.hostRole)} border border-white/20 rounded-xl p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getPlayerInitials(game.hostName)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-white">{game.hostName}</h3>
                    <div className="flex items-center space-x-1">
                      {getHostRoleIcon(game.hostRole)}
                      <span className="text-xs text-gray-300 capitalize">{game.hostRole}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className={getRatingColor(game.hostRating)}>{game.hostRating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300">{game.timeControl}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <Badge 
                  variant={timeControlBadge.variant as any}
                  className="text-xs"
                >
                  {timeControlBadge.label}
                </Badge>
                <Badge variant="default" className="bg-green-600 text-white text-xs">
                  Waiting
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                Playing as: <span className="text-white font-medium">
                  {game.hostRole === "defender" ? "Attacker" : "Defender"}
                </span>
              </div>
              
              <Button
                onClick={() => onJoinGame(game.id)}
                disabled={isJoining}
                className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-6 py-2"
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Join Battle
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
