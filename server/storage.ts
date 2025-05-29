import { users, games, chatMessages, type User, type InsertUser, type Game, type InsertGame, type ChatMessage, type InsertChatMessage, type BoardState, type PieceType } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentGameId: number;
  private currentChatId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentChatId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      id,
      rating: insertUser.rating ?? 1200,
      wins: insertUser.wins ?? 0,
      losses: insertUser.losses ?? 0,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStats(id: number, wins: number, losses: number, rating: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.wins = wins;
      user.losses = losses;
      user.rating = rating;
    }
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const game: Game = {
      ...insertGame,
      id,
      guestId: insertGame.guestId ?? null,
      status: insertGame.status ?? "waiting",
      currentPlayer: insertGame.currentPlayer ?? "attacker",
      hostRole: insertGame.hostRole ?? "defender",
      timeControl: insertGame.timeControl ?? "15+10",
      winnerId: insertGame.winnerId ?? null,
      winCondition: insertGame.winCondition ?? null,
      moveHistory: insertGame.moveHistory ?? [],
      createdAt: new Date(),
      completedAt: null,
    };
    this.games.set(id, game);
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getActiveGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.status === "active");
  }

  async getWaitingGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.status === "waiting");
  }

  async getUserGames(userId: number): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      game => game.hostId === userId || game.guestId === userId
    );
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (game) {
      Object.assign(game, updates);
      return game;
    }
    return undefined;
  }

  async joinGame(gameId: number, guestId: number): Promise<Game | undefined> {
    const game = this.games.get(gameId);
    if (game && game.status === "waiting" && !game.guestId) {
      game.guestId = guestId;
      game.status = "active";
      return game;
    }
    return undefined;
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getGameChatMessages(gameId: number): Promise<(ChatMessage & { senderName: string })[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => msg.gameId === gameId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const result = [];
    for (const message of messages) {
      const sender = this.users.get(message.senderId);
      if (sender) {
        result.push({
          ...message,
          senderName: sender.displayName,
        });
      }
    }
    return result;
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

export const storage = new MemStorage();

// Create some default users for testing
const defaultUsers = [
  { username: "erik_bold", password: "password", displayName: "Erik the Bold", rating: 1420, wins: 15, losses: 8 },
  { username: "ragnar_iron", password: "password", displayName: "Ragnar Iron", rating: 1650, wins: 23, losses: 12 },
  { username: "freya_shield", password: "password", displayName: "Freya Shield", rating: 1580, wins: 19, losses: 11 },
];

defaultUsers.forEach(async (userData) => {
  await storage.createUser(userData);
});

// Create some waiting games
setTimeout(async () => {
  await storage.createGame({
    hostId: 1,
    guestId: null,
    status: "waiting",
    currentPlayer: "attacker",
    boardState: createInitialBoard(),
    hostRole: "defender",
    timeControl: "10+5",
    winnerId: null,
    winCondition: null,
    moveHistory: [],
  });

  await storage.createGame({
    hostId: 2,
    guestId: null,
    status: "waiting",
    currentPlayer: "attacker",
    boardState: createInitialBoard(),
    hostRole: "attacker",
    timeControl: "15+10",
    winnerId: null,
    winCondition: null,
    moveHistory: [],
  });
}, 100);
