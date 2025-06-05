import { users, games, chatMessages, type User, type InsertUser, type Game, type InsertGame, type ChatMessage, type InsertChatMessage, type BoardState, type PieceType } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(id: number, wins: number, losses: number, rating: number): Promise<void>;

  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  getActiveGames(): Promise<Game[]>;
  getWaitingGames(): Promise<Game[]>;
  getUserGames(userId: number): Promise<Game[]>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined>;
  joinGame(gameId: number, guestId: number): Promise<Game | undefined>;

  // Chat operations
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getGameChatMessages(gameId: number): Promise<(ChatMessage & { senderName: string })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStats(id: number, wins: number, losses: number, rating: number): Promise<void> {
    await db
      .update(users)
      .set({ wins, losses, rating })
      .where(eq(users.id, id));
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async getActiveGames(): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.status, "active"));
  }

  async getWaitingGames(): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.status, "waiting"));
  }

  async getUserGames(userId: number): Promise<Game[]> {
    return await db.select().from(games).where(
      eq(games.hostId, userId)
    );
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return game || undefined;
  }

  async joinGame(gameId: number, guestId: number): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set({ guestId, status: "active" })
      .where(eq(games.id, gameId))
      .returning();
    return game || undefined;
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getGameChatMessages(gameId: number): Promise<(ChatMessage & { senderName: string })[]> {
    const messages = await db
      .select({
        id: chatMessages.id,
        gameId: chatMessages.gameId,
        senderId: chatMessages.senderId,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        senderName: users.displayName,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.gameId, gameId))
      .orderBy(chatMessages.createdAt);

    return messages;
  }
}

// Initialize with default board state
function createInitialBoard(): BoardState {
  const board: BoardState = Array(11).fill(null).map(() => Array(11).fill(null));
  
  // Place attackers
  const attackerPositions = [
    // Top row
    [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
    // Left side
    [3, 0], [4, 0], [5, 0], [6, 0], [7, 0],
    // Right side
    [3, 10], [4, 10], [5, 10], [6, 10], [7, 10],
    // Bottom row
    [10, 3], [10, 4], [10, 5], [10, 6], [10, 7],
    // Second row/column
    [1, 5], [9, 5], [5, 1], [5, 9]
  ];

  attackerPositions.forEach(([row, col]) => {
    board[row][col] = "attacker";
  });

  // Place defenders
  const defenderPositions = [
    [3, 5], [4, 4], [4, 5], [4, 6], [5, 3], [5, 4], [5, 6], [5, 7],
    [6, 4], [6, 5], [6, 6], [7, 5]
  ];

  defenderPositions.forEach(([row, col]) => {
    board[row][col] = "defender";
  });

  // Place king in center
  board[5][5] = "king";

  return board;
}

export const storage = new DatabaseStorage();

// Initialize database 
async function initializeDatabase() {
  try {
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Initialize when module loads
initializeDatabase();
