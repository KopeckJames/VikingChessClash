-- CreateTable
CREATE TABLE "ai_opponents" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "personality" TEXT NOT NULL,
    "avatar" TEXT,
    "thinking_time" INTEGER NOT NULL DEFAULT 2000,
    "strategy" JSONB NOT NULL DEFAULT '{}',
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_opponents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_games" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "ai_opponent_id" INTEGER NOT NULL,
    "ai_role" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_games_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_games" ADD CONSTRAINT "ai_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_games" ADD CONSTRAINT "ai_games_ai_opponent_id_fkey" FOREIGN KEY ("ai_opponent_id") REFERENCES "ai_opponents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;