-- CreateEnum
CREATE TYPE "DailyChallengeStatus" AS ENUM ('DRAFT', 'APPROVED', 'VOID');

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "dateUtc" DATE NOT NULL,
    "status" "DailyChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeRound" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "frameId" TEXT NOT NULL,

    CONSTRAINT "DailyChallengeRound_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DailyChallengeRound_roundNumber_check" CHECK ("roundNumber" BETWEEN 1 AND 5)
);

-- CreateTable
CREATE TABLE "DailyAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "ranked" BOOLEAN NOT NULL,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DailyAttempt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DailyAttempt_currentRound_check" CHECK ("currentRound" BETWEEN 0 AND 5),
    CONSTRAINT "DailyAttempt_totalScore_check" CHECK ("totalScore" BETWEEN 0 AND 25000),
    CONSTRAINT "DailyAttempt_completion_check" CHECK ("completedAt" IS NULL OR "currentRound" = 5)
);

-- CreateTable
CREATE TABLE "DailyRoundGuess" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "frameId" TEXT NOT NULL,
    "guessedEpisodeId" INTEGER NOT NULL,
    "distance" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyRoundGuess_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DailyRoundGuess_roundNumber_check" CHECK ("roundNumber" BETWEEN 1 AND 5),
    CONSTRAINT "DailyRoundGuess_distance_check" CHECK ("distance" >= 0),
    CONSTRAINT "DailyRoundGuess_score_check" CHECK ("score" BETWEEN 0 AND 5000)
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_dateUtc_key" ON "DailyChallenge"("dateUtc");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeRound_frameId_key" ON "DailyChallengeRound"("frameId");

-- CreateIndex
CREATE INDEX "DailyChallengeRound_challengeId_idx" ON "DailyChallengeRound"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeRound_challengeId_roundNumber_key" ON "DailyChallengeRound"("challengeId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeRound_challengeId_frameId_key" ON "DailyChallengeRound"("challengeId", "frameId");

-- CreateIndex
CREATE INDEX "DailyAttempt_userId_challengeId_ranked_idx" ON "DailyAttempt"("userId", "challengeId", "ranked");

-- Only one ranked attempt may exist for a user and Daily. Practice attempts remain unlimited.
CREATE UNIQUE INDEX "DailyAttempt_one_ranked_per_user_challenge"
ON "DailyAttempt"("userId", "challengeId")
WHERE "ranked" = true;

-- CreateIndex
CREATE INDEX "DailyAttempt_challengeId_ranked_completedAt_totalScore_idx" ON "DailyAttempt"("challengeId", "ranked", "completedAt", "totalScore");

-- CreateIndex
CREATE INDEX "DailyRoundGuess_frameId_idx" ON "DailyRoundGuess"("frameId");

-- CreateIndex
CREATE INDEX "DailyRoundGuess_guessedEpisodeId_idx" ON "DailyRoundGuess"("guessedEpisodeId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRoundGuess_attemptId_roundNumber_key" ON "DailyRoundGuess"("attemptId", "roundNumber");

-- AddForeignKey
ALTER TABLE "DailyChallengeRound" ADD CONSTRAINT "DailyChallengeRound_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeRound" ADD CONSTRAINT "DailyChallengeRound_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttempt" ADD CONSTRAINT "DailyAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttempt" ADD CONSTRAINT "DailyAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRoundGuess" ADD CONSTRAINT "DailyRoundGuess_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "DailyAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRoundGuess" ADD CONSTRAINT "DailyRoundGuess_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "Frame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRoundGuess" ADD CONSTRAINT "DailyRoundGuess_guessedEpisodeId_fkey" FOREIGN KEY ("guessedEpisodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
