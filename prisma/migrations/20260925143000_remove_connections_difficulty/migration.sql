-- Connections group difficulty did not affect gameplay or validation quality.
-- Group position remains the canonical reveal and display order.
DROP INDEX "ConnectionsGroup_puzzleId_difficulty_key";
ALTER TABLE "ConnectionsGroup" DROP COLUMN "difficulty";
DROP TYPE "ConnectionsDifficulty";
