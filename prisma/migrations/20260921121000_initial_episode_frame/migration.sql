-- CreateEnum
CREATE TYPE "FrameDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "season" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "globalOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "durationMs" INTEGER,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Frame" (
    "id" TEXT NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "timestampMs" INTEGER NOT NULL,
    "difficulty" "FrameDifficulty" NOT NULL,
    "objectKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Frame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Episode_globalOrder_key" ON "Episode"("globalOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_season_episodeNumber_key" ON "Episode"("season", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Frame_objectKey_key" ON "Frame"("objectKey");

-- CreateIndex
CREATE INDEX "Frame_episodeId_enabled_idx" ON "Frame"("episodeId", "enabled");

-- CreateIndex
CREATE INDEX "Frame_difficulty_enabled_idx" ON "Frame"("difficulty", "enabled");

-- AddForeignKey
ALTER TABLE "Frame" ADD CONSTRAINT "Frame_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
