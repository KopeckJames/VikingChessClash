import { Crown, Shield, Sword, Star, Trophy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRankByRating, getRankProgress, type NorseRank } from "@shared/rating-system";

interface RatingBadgeProps {
  rating: number;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getRankIcon = (rankName: string) => {
  switch (rankName) {
    case "Thrall": return Shield;
    case "Karl": return Sword;
    case "Warrior": return Star;
    case "Jarl": return Trophy;
    case "Skald": return Zap;
    case "Konungr": return Crown;
    default: return Shield;
  }
};

export default function RatingBadge({ rating, showProgress = false, size = "md", className }: RatingBadgeProps) {
  const rank = getRankByRating(rating);
  const { current, next, progress } = getRankProgress(rating);
  const Icon = getRankIcon(rank.name);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="outline" 
        className={`${sizeClasses[size]} ${rank.color} border-current bg-gradient-to-r from-black/20 to-transparent backdrop-blur-sm`}
      >
        <Icon className={`${iconSizes[size]} mr-1`} />
        <span className="font-bold">{rank.name}</span>
        <span className="ml-1 opacity-75">({rating})</span>
      </Badge>
      
      {showProgress && next && (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${rank.color.replace('text-', 'bg-')} transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-gray-400">
            {rating - current.minRating}/{current.maxRating - current.minRating} to {next.name}
          </span>
        </div>
      )}
    </div>
  );
}