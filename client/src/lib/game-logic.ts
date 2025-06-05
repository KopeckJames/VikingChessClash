import type { BoardState, PieceType, Position } from "@shared/schema";

export function isValidMove(board: BoardState, from: Position, to: Position, piece: PieceType): boolean {
  if (!piece || from.row === to.row && from.col === to.col) return false;
  
  // Check bounds
  if (to.row < 0 || to.row >= 11 || to.col < 0 || to.col >= 11) return false;
  
  // Check if destination is empty
  if (board[to.row][to.col] !== null) return false;
  
  // Check if path is clear (pieces move in straight lines only)
  if (from.row !== to.row && from.col !== to.col) return false;
  
  // Check if path is clear
  const rowDir = to.row > from.row ? 1 : to.row < from.row ? -1 : 0;
  const colDir = to.col > from.col ? 1 : to.col < from.col ? -1 : 0;
  
  let checkRow = from.row + rowDir;
  let checkCol = from.col + colDir;
  
  while (checkRow !== to.row || checkCol !== to.col) {
    if (board[checkRow][checkCol] !== null) return false;
    checkRow += rowDir;
    checkCol += colDir;
  }
  
  // Special rules for throne square
  const isThrone = (row: number, col: number) => row === 5 && col === 5;
  const isCorner = (row: number, col: number) => 
    (row === 0 && col === 0) || (row === 0 && col === 10) ||
    (row === 10 && col === 0) || (row === 10 && col === 10);
  
  // Only the king can enter/leave the throne
  if (isThrone(to.row, to.col) && piece !== "king") return false;
  
  // Attackers and defenders cannot occupy corner squares
  if (isCorner(to.row, to.col) && piece !== "king") return false;
  
  return true;
}

export function calculateCaptures(board: BoardState, position: Position): Position[] {
  const captures: Position[] = [];
  const piece = board[position.row][position.col];
  
  if (!piece) return captures;
  
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [dr, dc] of directions) {
    const adjacentRow = position.row + dr;
    const adjacentCol = position.col + dc;
    const oppositeRow = position.row + dr * 2;
    const oppositeCol = position.col + dc * 2;
    
    // Check bounds
    if (adjacentRow < 0 || adjacentRow >= 11 || adjacentCol < 0 || adjacentCol >= 11) continue;
    if (oppositeRow < 0 || oppositeRow >= 11 || oppositeCol < 0 || oppositeCol >= 11) continue;
    
    const adjacentPiece = board[adjacentRow][adjacentCol];
    const oppositePiece = board[oppositeRow][oppositeCol];
    
    // Can't capture your own pieces or empty squares
    if (!adjacentPiece || adjacentPiece === piece) continue;
    
    // King has special capture rules
    if (adjacentPiece === "king") {
      // King must be surrounded on all four sides to be captured
      continue; // Simplified - implement full king capture rules
    }
    
    // Regular capture: piece is captured if it's between two enemy pieces
    if (piece === "attacker" && (adjacentPiece === "defender" || adjacentPiece === "king")) {
      if (oppositePiece === piece || isSpecialSquare(oppositeRow, oppositeCol)) {
        captures.push({ row: adjacentRow, col: adjacentCol });
      }
    } else if ((piece === "defender" || piece === "king") && adjacentPiece === "attacker") {
      if (oppositePiece === piece || isSpecialSquare(oppositeRow, oppositeCol)) {
        captures.push({ row: adjacentRow, col: adjacentCol });
      }
    }
  }
  
  return captures;
}

function isSpecialSquare(row: number, col: number): boolean {
  // Throne square
  if (row === 5 && col === 5) return true;
  
  // Corner squares
  if ((row === 0 && col === 0) || (row === 0 && col === 10) ||
      (row === 10 && col === 0) || (row === 10 && col === 10)) return true;
  
  return false;
}

export function checkWinCondition(board: BoardState): { winner: "attacker" | "defender" | null; condition: string | null } {
  // Find the king
  let kingPosition: Position | null = null;
  
  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 11; col++) {
      if (board[row][col] === "king") {
        kingPosition = { row, col };
        break;
      }
    }
    if (kingPosition) break;
  }
  
  // King captured (not found on board)
  if (!kingPosition) {
    return { winner: "attacker", condition: "king_captured" };
  }
  
  // King escaped (reached corner)
  if ((kingPosition.row === 0 && kingPosition.col === 0) ||
      (kingPosition.row === 0 && kingPosition.col === 10) ||
      (kingPosition.row === 10 && kingPosition.col === 0) ||
      (kingPosition.row === 10 && kingPosition.col === 10)) {
    return { winner: "defender", condition: "king_escape" };
  }
  
  // Game continues
  return { winner: null, condition: null };
}

export function createInitialBoard(): BoardState {
  const board: BoardState = Array(11).fill(null).map(() => Array(11).fill(null));
  
  // Place attackers around the edges
  const attackerPositions = [
    // Top row
    [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
    // Left side  
    [3, 0], [4, 0], [5, 0], [6, 0], [7, 0],
    // Right side
    [3, 10], [4, 10], [5, 10], [6, 10], [7, 10],
    // Bottom row
    [10, 3], [10, 4], [10, 5], [10, 6], [10, 7],
    // Second row/column from edges
    [1, 5], [9, 5], [5, 1], [5, 9]
  ];
  
  attackerPositions.forEach(([row, col]) => {
    board[row][col] = "attacker";
  });
  
  // Place defenders around the center
  const defenderPositions = [
    [3, 5], [4, 4], [4, 5], [4, 6], [5, 3], [5, 4], [5, 6], [5, 7],
    [6, 4], [6, 5], [6, 6], [7, 5]
  ];
  
  defenderPositions.forEach(([row, col]) => {
    board[row][col] = "defender";
  });
  
  // Place king in the center (throne)
  board[5][5] = "king";
  
  return board;
}
