import { cn } from "@/lib/utils";
import { Crown, Shield, Sword } from "lucide-react";
import type { PieceType } from "@shared/schema";

interface PieceProps {
  type: PieceType;
  isSelected?: boolean;
  canMove?: boolean;
  className?: string;
}

export default function Piece({ type, isSelected, canMove, className }: PieceProps) {
  if (!type) return null;

  const getPieceIcon = () => {
    switch (type) {
      case "king":
        return <Crown className="w-full h-full text-yellow-900" />;
      case "defender":
        return <Shield className="w-full h-full text-white" />;
      case "attacker":
        return <Sword className="w-full h-full text-white" />;
      default:
        return null;
    }
  };

  const getPieceClass = () => {
    const baseClass = cn(
      "rounded-full flex items-center justify-center transition-all duration-200",
      "shadow-lg border-2",
      className,
      {
        "cursor-pointer hover:scale-110": canMove,
        "transform scale-110 ring-4 ring-opacity-60": isSelected,
      }
    );

    switch (type) {
      case "king":
        return cn(
          baseClass,
          "piece-king",
          "bg-gradient-to-br from-yellow-400 to-yellow-600",
          "border-yellow-300",
          {
            "ring-yellow-400": isSelected,
          }
        );
      case "defender":
        return cn(
          baseClass,
          "piece-defender", 
          "bg-gradient-to-br from-blue-500 to-blue-700",
          "border-blue-300",
          {
            "ring-blue-400": isSelected,
          }
        );
      case "attacker":
        return cn(
          baseClass,
          "piece-attacker",
          "bg-gradient-to-br from-red-500 to-red-700", 
          "border-red-300",
          {
            "ring-red-400": isSelected,
          }
        );
      default:
        return baseClass;
    }
  };

  return (
    <div className={getPieceClass()}>
      {getPieceIcon()}
    </div>
  );
}
