# Viking Chess Online (Hnefatafl)

## Overview

Viking Chess Online is a real-time multiplayer implementation of Hnefatafl, an ancient Norse strategy board game. The application features an 11x11 game board with asymmetric gameplay where defenders protect the king while attackers attempt to capture him. Players can create and join games, chat during matches, track their ratings through a Norse-themed ranking system, and compete on global leaderboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for the UI framework
- Vite as the build tool and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with a custom Norse/Viking theme

**Design Decisions:**
- **Component-based architecture**: Reusable UI components in `client/src/components/` separated by feature (chat, game-board, leaderboard, etc.)
- **Page-based routing**: Main pages (home, auth, lobby, game, leaderboard) organized in `client/src/pages/`
- **Custom hooks**: Encapsulated logic for WebSocket management (`use-websocket.ts`), game state (`use-game-state.ts`), and mobile detection
- **SEO optimization**: Comprehensive meta tags, structured data, breadcrumb navigation, and dynamic SEO updates per page
- **Real-time updates**: WebSocket integration for live game updates and chat messages

### Backend Architecture

**Technology Stack:**
- Express.js for the HTTP server
- WebSocket (ws library) for real-time bidirectional communication
- Drizzle ORM for database operations
- Neon serverless PostgreSQL as the database

**Design Decisions:**
- **REST + WebSocket hybrid**: HTTP endpoints for standard CRUD operations, WebSocket for real-time game events
- **Storage abstraction**: `IStorage` interface in `server/storage.ts` allows for database implementation swapping
- **Game logic separation**: Core game rules (move validation, capture detection) implemented in both client and server for validation
- **Session-less authentication**: User data stored in localStorage on client, with server-side user ID validation

### Data Storage

**Database Schema:**
- **users table**: Stores player profiles, ratings, statistics (wins/losses/draws), and ranking information
- **games table**: Contains game state, board position (as JSONB), player roles, time controls, and match outcomes
- **chatMessages table**: Persists in-game chat history linked to specific games

**Key Design Choices:**
- **JSONB for board state**: Flexible storage of the 11x11 game board and move history
- **Elo-based rating system**: Norse-themed ranking system (Thrall → Karl → Warrior → Jarl → Skald → Konungr) with rating progression
- **Timestamp tracking**: User activity monitoring for online/offline status and game completion times

### Authentication & Authorization

**Current Implementation:**
- Simple username/password authentication without encryption (suitable for development/demo)
- User credentials stored in PostgreSQL
- Client-side session management via localStorage
- No JWT or session tokens currently implemented

**Future Considerations:**
- Password hashing (bcrypt) should be implemented for production
- Session-based or token-based authentication recommended
- Role-based access control for administrative features

### External Dependencies

**Third-Party Services:**
- **Neon Database**: Serverless PostgreSQL database with WebSocket support for serverless environments
- **Replit Infrastructure**: Development and hosting platform with built-in error overlay and cartographer plugins

**Key Libraries:**
- **Drizzle ORM & Kit**: Type-safe database operations and migrations
- **Radix UI**: Accessible component primitives for the UI library
- **TanStack Query**: Asynchronous state management and caching
- **WebSocket (ws)**: Real-time communication protocol
- **Zod**: Runtime type validation and schema parsing
- **class-variance-authority & clsx**: Utility-first styling management

**Analytics & SEO:**
- Custom analytics manager for tracking user actions and page views
- Structured data (JSON-LD) for search engine optimization
- OpenGraph and Twitter card meta tags for social sharing
- Sitemap and robots.txt configuration for search indexing