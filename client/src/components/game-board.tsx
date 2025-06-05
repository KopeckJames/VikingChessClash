import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import Piece from "./piece";
import { isValidMove } from "@/lib/game-logic";
import type { Game, BoardState, PieceType, Position, Move } from "@shared/schema";

interface GameBoardProps {
  game: Game;
  onMove: (move: Move) => void;
  isPlayerTurn: boolean;
  userRole: "attacker" | "defender";
}

export default function GameBoard({ game, onMove, isPlayerTurn, userRole }: GameBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  
  const board = game.boardState as BoardState;

  const handleSquareClick = useCallback((row: number, col: number) => {
    const clickedPiece = board[row][col];
    const clickedPosition = { row, col };

    // If there's a selected piece and this is a valid move
    if (selectedSquare && validMoves.some(move => move.row === row && move.col === col)) {
      const piece = board[selectedSquare.row][selectedSquare.col];
      const move: Move = {
        from: selectedSquare,
        to: clickedPosition,
        piece,
        timestamp: Date.now(),
      };
      
      onMove(move);
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // If clicking on a piece that belongs to the current player
    if (clickedPiece && isPlayerTurn && game.status === "active") {
      const canSelectPiece = 
        (userRole === "defender" && (clickedPiece === "king" || clickedPiece === "defender")) ||
        (userRole === "attacker" && clickedPiece === "attacker");
      
      if (canSelectPiece) {
        setSelectedSquare(clickedPosition);
        // Calculate valid moves for this piece
        const moves = calculateValidMoves(board, clickedPosition, clickedPiece);
        setValidMoves(moves);
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [board, selectedSquare, validMoves, isPlayerTurn, userRole, game.status, onMove]);

  const calculateValidMoves = (board: BoardState, from: Position, piece: PieceType): Position[] => {
    const moves: Position[] = [];
    
    if (!piece) return moves;

    // Check all directions (horizontal and vertical)
    const directions = [
      [-1, 0], [1, 0],  // vertical
      [0, -1], [0, 1]   // horizontal
    ];

    for (const [dr, dc] of directions) {
      for (let distance = 1; distance < 11; distance++) {
        const newRow = from.row + dr * distance;
        const newCol = from.col + dc * distance;
        
        // Check bounds
        if (newRow < 0 || newRow >= 11 || newCol < 0 || newCol >= 11) break;
        
        const targetSquare = { row: newRow, col: newCol };
        
        if (isValidMove(board, from, targetSquare, piece)) {
          moves.push(targetSquare);
        } else {
          break; // Path is blocked
        }
      }
    }

    return moves;
  };

  const isSquareSelected = (row: number, col: number) => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  };

  const isValidMoveSquare = (row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  const getSquareClass = (row: number, col: number) => {
    const isThrone = row === 5 && col === 5;
    const isCorner = (row === 0 && col === 0) || (row === 0 && col === 10) ||
                    (row === 10 && col === 0) || (row === 10 && col === 10);
    
    return cn(
      "board-cell",
      "w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12",
      "border border-amber-300 rounded-sm",
      "flex items-center justify-center cursor-pointer",
      "transition-all duration-200 hover:scale-105",
      {
        "bg-amber-100": !isThrone && !isCorner,
        "throne": isThrone,
        "corner": isCorner,
        "selected": isSquareSelected(row, col),
        "valid-move": isValidMoveSquare(row, col),
        "bg-yellow-200 ring-2 ring-yellow-400": isSquareSelected(row, col),
        "bg-green-200 ring-2 ring-green-400": isValidMoveSquare(row, col),
        "bg-gradient-to-br from-yellow-200 to-yellow-300 border-2 border-yellow-500": isThrone,
        "bg-gradient-to-br from-red-200 to-red-300 border-2 border-red-500": isCorner,
      }
    );
  };

  return (
    <div className="flex justify-center">
      <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-4 rounded-2xl shadow-inner">
        <div className="grid grid-cols-11 gap-1 max-w-sm md:max-w-md lg:max-w-lg mx-auto">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getSquareClass(rowIndex, colIndex)}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                {piece && (
                  <Piece
                    type={piece}
                    isSelected={isSquareSelected(rowIndex, colIndex)}
                    canMove={isPlayerTurn && game.status === "active"}
                    className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10"
                  />
                )}
                {isValidMoveSquare(rowIndex, colIndex) && !piece && (
                  <div className="w-3 h-3 bg-green-400 rounded-full opacity-80 animate-pulse" />
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-gray-600">Valid Move</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-gray-600">Selected</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-300 border border-yellow-500 rounded-sm"></div>
            <span className="text-gray-600">Throne</span>
          </div>
        </div>
      </div>
    </div>
  );
}
