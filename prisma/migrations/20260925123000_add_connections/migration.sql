-- CreateEnum
CREATE TYPE "ConnectionsPuzzleStatus" AS ENUM ('DRAFT', 'APPROVED', 'VOID');

-- CreateEnum
CREATE TYPE "ConnectionsDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'TRICKY');

-- CreateEnum
CREATE TYPE "ConnectionsSubmissionResult" AS ENUM ('CORRECT', 'INCORRECT');

-- CreateTable
CREATE TABLE "ConnectionsPuzzle" (
    "id" TEXT NOT NULL,
    "dateUtc" DATE NOT NULL,
    "status" "ConnectionsPuzzleStatus" NOT NULL DEFAULT 'DRAFT',
    "spoilerNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionsPuzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionsGroup" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "difficulty" "ConnectionsDifficulty" NOT NULL,
    "label" TEXT NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "ConnectionsGroup_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConnectionsGroup_position_check" CHECK ("position" BETWEEN 1 AND 4)
);

-- CreateTable
CREATE TABLE "ConnectionsTile" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,

    CONSTRAINT "ConnectionsTile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionsAttempt" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ranked" BOOLEAN NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "ConnectionsAttempt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConnectionsAttempt_terminal_state_check" CHECK ("completedAt" IS NULL OR "failedAt" IS NULL)
);

-- CreateTable
CREATE TABLE "ConnectionsSubmission" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "result" "ConnectionsSubmissionResult" NOT NULL,
    "matchedGroupId" TEXT,
    "oneAway" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectionsSubmission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConnectionsSubmission_sequence_check" CHECK ("sequence" >= 1),
    CONSTRAINT "ConnectionsSubmission_result_check" CHECK (
        ("result" = 'CORRECT' AND "matchedGroupId" IS NOT NULL AND "oneAway" = false)
        OR ("result" = 'INCORRECT' AND "matchedGroupId" IS NULL)
    )
);

-- CreateTable
CREATE TABLE "ConnectionsSubmissionTile" (
    "submissionId" TEXT NOT NULL,
    "tileId" TEXT NOT NULL,

    CONSTRAINT "ConnectionsSubmissionTile_pkey" PRIMARY KEY ("submissionId", "tileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionsPuzzle_dateUtc_key" ON "ConnectionsPuzzle"("dateUtc");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionsGroup_id_puzzleId_key" ON "ConnectionsGroup"("id", "puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionsGroup_puzzleId_position_key" ON "ConnectionsGroup"("puzzleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionsGroup_puzzleId_difficulty_key" ON "ConnectionsGroup"("puzzleId", "difficulty");

-- CreateIndex
CREATE INDEX "ConnectionsGroup_puzzleId_idx" ON "ConnectionsGroup"("puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionsTile_puzzleId_normalizedText_key" ON "ConnectionsTile"("puzzleId", "normalizedText");

-- CreateIndex
CREATE INDEX "ConnectionsTile_groupId_puzzleId_idx" ON "ConnectionsTile"("groupId", "puzzleId");

-- CreateIndex
CREATE INDEX "ConnectionsAttempt_userId_puzzleId_ranked_idx" ON "ConnectionsAttempt"("userId", "puzzleId", "ranked");

-- One ranked attempt may exist per account and puzzle. Practice attempts remain unlimited.
CREATE UNIQUE INDEX "ConnectionsAttempt_one_ranked_per_user_puzzle"
ON "ConnectionsAttempt"("userId", "puzzleId")
WHERE "ranked" = true;

-- CreateIndex
CREATE INDEX "ConnectionsAttempt_puzzleId_ranked_completedAt_failedAt_idx" ON "ConnectionsAttempt"("puzzleId", "ranked", "completedAt", "failedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionsSubmission_attemptId_sequence_key" ON "ConnectionsSubmission"("attemptId", "sequence");

-- CreateIndex
CREATE INDEX "ConnectionsSubmission_matchedGroupId_idx" ON "ConnectionsSubmission"("matchedGroupId");

-- CreateIndex
CREATE INDEX "ConnectionsSubmissionTile_tileId_idx" ON "ConnectionsSubmissionTile"("tileId");

-- AddForeignKey
ALTER TABLE "ConnectionsGroup" ADD CONSTRAINT "ConnectionsGroup_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "ConnectionsPuzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionsTile" ADD CONSTRAINT "ConnectionsTile_groupId_puzzleId_fkey" FOREIGN KEY ("groupId", "puzzleId") REFERENCES "ConnectionsGroup"("id", "puzzleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionsAttempt" ADD CONSTRAINT "ConnectionsAttempt_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "ConnectionsPuzzle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionsAttempt" ADD CONSTRAINT "ConnectionsAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionsSubmission" ADD CONSTRAINT "ConnectionsSubmission_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ConnectionsAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionsSubmission" ADD CONSTRAINT "ConnectionsSubmission_matchedGroupId_fkey" FOREIGN KEY ("matchedGroupId") REFERENCES "ConnectionsGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionsSubmissionTile" ADD CONSTRAINT "ConnectionsSubmissionTile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ConnectionsSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionsSubmissionTile" ADD CONSTRAINT "ConnectionsSubmissionTile_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "ConnectionsTile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
