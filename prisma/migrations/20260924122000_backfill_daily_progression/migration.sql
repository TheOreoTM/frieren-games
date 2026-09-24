-- Preserve progression earned through ranked Dailies completed before Phase 6.
INSERT INTO "XPTransaction" (
  "id", "userId", "source", "sourceKey", "amount", "earnedDateUtc", "createdAt"
)
SELECT
  'phase6:daily-completion:' || attempt."id",
  attempt."userId",
  'DAILY_COMPLETION'::"XPSource",
  attempt."id",
  50,
  challenge."dateUtc",
  CURRENT_TIMESTAMP
FROM "DailyAttempt" AS attempt
JOIN "DailyChallenge" AS challenge ON challenge."id" = attempt."challengeId"
WHERE attempt."ranked" = true
  AND attempt."completedAt" IS NOT NULL
  AND challenge."status" <> 'VOID'
ON CONFLICT ("userId", "source", "sourceKey") DO NOTHING;

INSERT INTO "XPTransaction" (
  "id", "userId", "source", "sourceKey", "amount", "earnedDateUtc", "createdAt"
)
SELECT
  'phase6:daily-performance:' || attempt."id",
  attempt."userId",
  'DAILY_PERFORMANCE'::"XPSource",
  attempt."id",
  FLOOR(attempt."totalScore" / 5000.0)::INTEGER * 5,
  challenge."dateUtc",
  CURRENT_TIMESTAMP
FROM "DailyAttempt" AS attempt
JOIN "DailyChallenge" AS challenge ON challenge."id" = attempt."challengeId"
WHERE attempt."ranked" = true
  AND attempt."completedAt" IS NOT NULL
  AND challenge."status" <> 'VOID'
  AND attempt."totalScore" >= 5000
ON CONFLICT ("userId", "source", "sourceKey") DO NOTHING;

-- First game and first Daily share the same existing completion evidence.
INSERT INTO "UserAchievement" ("userId", "achievementId", "unlockedAt")
SELECT DISTINCT attempt."userId", achievement."id", CURRENT_TIMESTAMP
FROM "DailyAttempt" AS attempt
JOIN "DailyChallenge" AS challenge ON challenge."id" = attempt."challengeId"
CROSS JOIN (VALUES ('FIRST_STEPS'), ('DAILY_INITIATE')) AS achievement("id")
WHERE attempt."ranked" = true
  AND attempt."completedAt" IS NOT NULL
  AND challenge."status" <> 'VOID'
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("userId", "achievementId", "unlockedAt")
SELECT attempt."userId", 'BULLSEYE', CURRENT_TIMESTAMP
FROM "DailyAttempt" AS attempt
JOIN "DailyChallenge" AS challenge ON challenge."id" = attempt."challengeId"
JOIN "DailyRoundGuess" AS guess ON guess."attemptId" = attempt."id"
WHERE attempt."ranked" = true
  AND attempt."completedAt" IS NOT NULL
  AND challenge."status" <> 'VOID'
  AND guess."distance" = 0
GROUP BY attempt."userId"
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("userId", "achievementId", "unlockedAt")
SELECT attempt."userId", 'KEEN_EYE', CURRENT_TIMESTAMP
FROM "DailyAttempt" AS attempt
JOIN "DailyChallenge" AS challenge ON challenge."id" = attempt."challengeId"
JOIN "DailyRoundGuess" AS guess ON guess."attemptId" = attempt."id"
WHERE attempt."ranked" = true
  AND attempt."completedAt" IS NOT NULL
  AND challenge."status" <> 'VOID'
  AND guess."distance" = 0
GROUP BY attempt."userId"
HAVING COUNT(*) >= 5
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("userId", "achievementId", "unlockedAt")
SELECT attempt."userId", 'SCHOLAR_OF_THE_ERA', CURRENT_TIMESTAMP
FROM "DailyAttempt" AS attempt
JOIN "DailyChallenge" AS challenge ON challenge."id" = attempt."challengeId"
WHERE attempt."ranked" = true
  AND attempt."completedAt" IS NOT NULL
  AND challenge."status" <> 'VOID'
GROUP BY attempt."userId"
HAVING COUNT(*) >= 10
ON CONFLICT ("userId", "achievementId") DO NOTHING;

INSERT INTO "UserAchievement" ("userId", "achievementId", "unlockedAt")
SELECT DISTINCT attempt."userId", 'TWENTY_FIVE_K', CURRENT_TIMESTAMP
FROM "DailyAttempt" AS attempt
JOIN "DailyChallenge" AS challenge ON challenge."id" = attempt."challengeId"
WHERE attempt."ranked" = true
  AND attempt."completedAt" IS NOT NULL
  AND attempt."totalScore" = 25000
  AND challenge."status" <> 'VOID'
ON CONFLICT ("userId", "achievementId") DO NOTHING;

-- Achievement XP is also conflict-safe and can repair a missing ledger row.
INSERT INTO "XPTransaction" (
  "id", "userId", "source", "sourceKey", "amount", "earnedDateUtc", "createdAt"
)
SELECT
  'phase6:achievement:' || unlocked."userId" || ':' || unlocked."achievementId",
  unlocked."userId",
  'ACHIEVEMENT'::"XPSource",
  unlocked."achievementId",
  CASE unlocked."achievementId"
    WHEN 'FIRST_STEPS' THEN 25
    WHEN 'DAILY_INITIATE' THEN 25
    WHEN 'BULLSEYE' THEN 25
    WHEN 'KEEN_EYE' THEN 50
    WHEN 'SCHOLAR_OF_THE_ERA' THEN 100
    WHEN 'TENURE' THEN 150
    WHEN 'TWENTY_FIVE_K' THEN 100
  END,
  (unlocked."unlockedAt" AT TIME ZONE 'UTC')::DATE,
  unlocked."unlockedAt"
FROM "UserAchievement" AS unlocked
ON CONFLICT ("userId", "source", "sourceKey") DO NOTHING;
