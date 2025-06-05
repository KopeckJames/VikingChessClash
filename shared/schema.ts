import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  rating: integer("rating").notNull().default(1200),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull().references(() => users.id),
  guestId: integer("guest_id").references(() => users.id),
  status: text("status").notNull().default("waiting"), // waiting, active, completed
  currentPlayer: text("current_player").notNull().default("attacker"), // attacker, defender
  boardState: jsonb("board_state").notNull(),
  hostRole: text("host_role").notNull().default("defender"), // attacker, defender
  timeControl: text("time_control").notNull().default("15+10"),
  winnerId: integer("winner_id").references(() => users.id),
  winCondition: text("win_condition"), // king_escape, king_captured, resignation, draw
  moveHistory: jsonb("move_history").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).partial({
  guestId: true,
  winnerId: true,
  winCondition: true,
  moveHistory: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Game-specific types
export type PieceType = "king" | "defender" | "attacker" | null;
export type GameRole = "attacker" | "defender";
export type Position = { row: number; col: number };
export type Move = {
  from: Position;
  to: Position;
  piece: PieceType;
  captured?: Position[];
  timestamp: number;
};

export type BoardState = PieceType[][];

// WebSocket message types
export type WSMessage = 
  | { type: "join_game"; gameId: number; userId: number }
  | { type: "make_move"; gameId: number; move: Move }
  | { type: "send_chat"; gameId: number; message: string }
  | { type: "game_update"; game: Game }
  | { type: "chat_message"; message: ChatMessage & { senderName: string } }
  | { type: "error"; message: string };
