-- CreateEnum
CREATE TYPE "XPSource" AS ENUM ('DAILY_COMPLETION', 'DAILY_PERFORMANCE', 'UNLIMITED_COMPLETION', 'ACHIEVEMENT');

-- CreateTable
CREATE TABLE "UnlimitedAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlimitedAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlimitedRoundGuess" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "frameId" TEXT NOT NULL,
    "guessedEpisodeId" INTEGER NOT NULL,
    "distance" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "UnlimitedRoundGuess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XPTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "XPSource" NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "earnedDateUtc" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateIndex
CREATE INDEX "UnlimitedAttempt_userId_completedAt_idx" ON "UnlimitedAttempt"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "UnlimitedAttempt_userId_totalScore_idx" ON "UnlimitedAttempt"("userId", "totalScore");

-- CreateIndex
CREATE INDEX "UnlimitedRoundGuess_frameId_idx" ON "UnlimitedRoundGuess"("frameId");

-- CreateIndex
CREATE INDEX "UnlimitedRoundGuess_guessedEpisodeId_idx" ON "UnlimitedRoundGuess"("guessedEpisodeId");

-- CreateIndex
CREATE UNIQUE INDEX "UnlimitedRoundGuess_attemptId_roundNumber_key" ON "UnlimitedRoundGuess"("attemptId", "roundNumber");

-- CreateIndex
CREATE INDEX "XPTransaction_userId_createdAt_idx" ON "XPTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "XPTransaction_userId_source_earnedDateUtc_idx" ON "XPTransaction"("userId", "source", "earnedDateUtc");

-- CreateIndex
CREATE UNIQUE INDEX "XPTransaction_userId_source_sourceKey_key" ON "XPTransaction"("userId", "source", "sourceKey");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- AddForeignKey
ALTER TABLE "UnlimitedAttempt" ADD CONSTRAINT "UnlimitedAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlimitedRoundGuess" ADD CONSTRAINT "UnlimitedRoundGuess_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "UnlimitedAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlimitedRoundGuess" ADD CONSTRAINT "UnlimitedRoundGuess_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlimitedRoundGuess" ADD CONSTRAINT "UnlimitedRoundGuess_guessedEpisodeId_fkey" FOREIGN KEY ("guessedEpisodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPTransaction" ADD CONSTRAINT "XPTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
