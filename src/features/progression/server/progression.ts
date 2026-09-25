import "server-only";

import { DailyChallengeStatus, type Prisma, XPSource } from "@/generated/prisma/client";
import { calculateDailyStreak } from "@/features/guessr/domain/daily-streak";
import { STANDARD_ROUND_COUNT } from "@/features/guessr/domain/score";
import { startOfUtcDate, utcDateKey } from "@/features/guessr/domain/utc-date";
import { getDb } from "@/lib/db";

import { ACHIEVEMENTS, earnedAchievementIds, newAchievementIds } from "../domain/achievements";
import {
  DAILY_COMPLETION_XP,
  dailyPerformanceXp,
  gameProgressionSummary,
  UNLIMITED_DAILY_XP_CAP,
  unlimitedXpGrant,
} from "../domain/progression";

type Database = Prisma.TransactionClient;

export type CompletedUnlimitedGame = {
  id: string;
  totalScore: number;
  rounds: Array<{
    roundNumber: number;
    frameId: string;
    guessedEpisodeId: number;
    distance: number;
    score: number;
  }>;
};

function isRetryableConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2002" || error.code === "P2034")
  );
}

async function runSerializable<T>(work: (database: Database) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await getDb().$transaction(work, { isolationLevel: "Serializable" });
    } catch (error) {
      lastError = error;
      if (!isRetryableConflict(error)) throw error;
    }
  }
  throw lastError;
}

async function achievementProgress(database: Database, userId: string, now: Date) {
  const today = startOfUtcDate(now);
  const [dailyGames, unlimitedGames, dailyExact, unlimitedExact, perfectDaily, perfectUnlimited, challenges, completions] =
    await Promise.all([
      database.dailyAttempt.count({
        where: {
          userId,
          ranked: true,
          completedAt: { not: null },
          challenge: { status: { not: DailyChallengeStatus.VOID } },
        },
      }),
      database.unlimitedAttempt.count({ where: { userId } }),
      database.dailyRoundGuess.count({
        where: {
          distance: 0,
          attempt: {
            userId,
            ranked: true,
            completedAt: { not: null },
            challenge: { status: { not: DailyChallengeStatus.VOID } },
          },
        },
      }),
      database.unlimitedRoundGuess.count({ where: { distance: 0, attempt: { userId } } }),
      database.dailyAttempt.count({
        where: {
          userId,
          ranked: true,
          completedAt: { not: null },
          totalScore: 25_000,
          challenge: { status: { not: DailyChallengeStatus.VOID } },
        },
      }),
      database.unlimitedAttempt.count({ where: { userId, totalScore: 25_000 } }),
      database.dailyChallenge.findMany({
        where: { dateUtc: { lte: today }, status: { not: DailyChallengeStatus.VOID } },
        orderBy: { dateUtc: "asc" },
        select: { id: true, dateUtc: true },
      }),
      database.dailyAttempt.findMany({
        where: {
          userId,
          ranked: true,
          completedAt: { not: null },
          challenge: { status: { not: DailyChallengeStatus.VOID } },
        },
        select: { challengeId: true },
      }),
    ]);
  const todayChallenge = challenges.find((challenge) => utcDateKey(challenge.dateUtc) === utcDateKey(today));

  return {
    gamesPlayed: dailyGames + unlimitedGames,
    rankedDailiesCompleted: dailyGames,
    exactGuesses: dailyExact + unlimitedExact,
    dailyStreak: calculateDailyStreak(
      challenges.map((challenge) => challenge.id),
      new Set(completions.map((completion) => completion.challengeId)),
      todayChallenge?.id,
    ),
    hasPerfectGame: perfectDaily + perfectUnlimited > 0,
  };
}

async function ensureAchievements(
  database: Database,
  userId: string,
  now: Date,
  earnedAt: Date,
) {
  const [progress, unlocked] = await Promise.all([
    achievementProgress(database, userId, now),
    database.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);
  const earnedIds = earnedAchievementIds(progress);
  if (earnedIds.length === 0) return;
  const newIds = newAchievementIds(
    progress,
    new Set(unlocked.map((achievement) => achievement.achievementId)),
  );

  if (newIds.length > 0) {
    await database.userAchievement.createMany({
      data: newIds.map((achievementId) => ({
        userId,
        achievementId,
        unlockedAt: earnedAt,
      })),
      skipDuplicates: true,
    });
  }
  await database.xPTransaction.createMany({
    data: earnedIds.map((achievementId) => ({
      userId,
      source: XPSource.ACHIEVEMENT,
      sourceKey: achievementId,
      amount: ACHIEVEMENTS[achievementId].xp,
      earnedDateUtc: startOfUtcDate(now),
      createdAt: earnedAt,
    })),
    skipDuplicates: true,
  });
}

async function awardDailyInTransaction(
  database: Database,
  userId: string,
  attemptId: string,
  now: Date,
) {
  const attempt = await database.dailyAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
      ranked: true,
      completedAt: { not: null },
      challenge: { status: { not: DailyChallengeStatus.VOID } },
    },
    select: {
      totalScore: true,
      completedAt: true,
      challenge: { select: { dateUtc: true } },
    },
  });
  if (!attempt || !attempt.completedAt) return;

  const performanceXp = dailyPerformanceXp(attempt.totalScore);
  await database.xPTransaction.createMany({
    data: [
      {
        userId,
        source: XPSource.DAILY_COMPLETION,
        sourceKey: attemptId,
        amount: DAILY_COMPLETION_XP,
        earnedDateUtc: attempt.challenge.dateUtc,
        createdAt: attempt.completedAt,
      },
      ...(performanceXp > 0
        ? [{
            userId,
            source: XPSource.DAILY_PERFORMANCE,
            sourceKey: attemptId,
            amount: performanceXp,
            earnedDateUtc: attempt.challenge.dateUtc,
            createdAt: attempt.completedAt,
          }]
        : []),
    ],
    skipDuplicates: true,
  });
  await ensureAchievements(database, userId, now, attempt.completedAt);
}

export async function ensureDailyProgression(userId: string, attemptId: string, now = new Date()) {
  await runSerializable((database) => awardDailyInTransaction(database, userId, attemptId, now));
}

export async function recordUnlimitedCompletion(
  userId: string,
  game: CompletedUnlimitedGame,
  now = new Date(),
) {
  if (game.rounds.length !== STANDARD_ROUND_COUNT) {
    throw new Error("A completed Unlimited game must contain five rounds.");
  }

  return runSerializable(async (database) => {
    const existing = await database.unlimitedAttempt.findUnique({ where: { id: game.id } });
    if (existing && existing.userId !== userId) throw new Error("Unlimited game ownership mismatch.");
    if (!existing) {
      await database.unlimitedAttempt.create({
        data: {
          id: game.id,
          userId,
          totalScore: game.totalScore,
          completedAt: now,
          guesses: {
            create: game.rounds.map((round) => ({
              roundNumber: round.roundNumber,
              frameId: round.frameId,
              guessedEpisodeId: round.guessedEpisodeId,
              distance: round.distance,
              score: round.score,
            })),
          },
        },
      });

      const earned = await database.xPTransaction.aggregate({
        where: {
          userId,
          source: XPSource.UNLIMITED_COMPLETION,
          earnedDateUtc: startOfUtcDate(now),
        },
        _sum: { amount: true },
      });
      const amount = unlimitedXpGrant(earned._sum.amount ?? 0);
      if (amount > 0) {
        await database.xPTransaction.create({
          data: {
            userId,
            source: XPSource.UNLIMITED_COMPLETION,
            sourceKey: game.id,
            amount,
            earnedDateUtc: startOfUtcDate(now),
            createdAt: now,
          },
        });
      }
    }

    await ensureAchievements(database, userId, now, existing?.completedAt ?? now);
    const total = await database.xPTransaction.aggregate({
      where: {
        userId,
        source: XPSource.UNLIMITED_COMPLETION,
        earnedDateUtc: startOfUtcDate(now),
      },
      _sum: { amount: true },
    });
    return { earnedToday: total._sum.amount ?? 0, cap: UNLIMITED_DAILY_XP_CAP };
  });
}

export async function getUnlimitedXpToday(userId: string, now = new Date()) {
  const result = await getDb().xPTransaction.aggregate({
    where: {
      userId,
      source: XPSource.UNLIMITED_COMPLETION,
      earnedDateUtc: startOfUtcDate(now),
    },
    _sum: { amount: true },
  });
  return { earned: result._sum.amount ?? 0, cap: UNLIMITED_DAILY_XP_CAP };
}

type RewardRow = {
  source: XPSource;
  sourceKey: string;
  amount: number;
};

function rewardLabel(reward: RewardRow) {
  if (reward.source === XPSource.DAILY_COMPLETION) return "Daily completion";
  if (reward.source === XPSource.DAILY_PERFORMANCE) return "Score bonus";
  if (reward.source === XPSource.UNLIMITED_COMPLETION) return "Unlimited completion";

  const achievementId = reward.sourceKey as keyof typeof ACHIEVEMENTS;
  return ACHIEVEMENTS[achievementId]
    ? `Achievement · ${ACHIEVEMENTS[achievementId].name}`
    : "Achievement unlocked";
}

async function progressionResult(userId: string, rewards: RewardRow[]) {
  const total = await getDb().xPTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const xpGained = rewards.reduce((sum, reward) => sum + reward.amount, 0);

  return {
    ...gameProgressionSummary(total._sum.amount ?? 0, xpGained),
    rewards: rewards.map((reward) => ({
      label: rewardLabel(reward),
      amount: reward.amount,
    })),
  };
}

async function rewardsForCompletion(
  userId: string,
  completedAt: Date,
  directSourceKey: string,
) {
  const batch = await getDb().xPTransaction.findMany({
    where: { userId, createdAt: completedAt },
    select: { source: true, sourceKey: true, amount: true },
    orderBy: { amount: "desc" },
  });
  if (batch.length > 0) return batch;

  // Rewards created before completion batching was introduced can still show
  // their direct completion and performance XP on historical result screens.
  return getDb().xPTransaction.findMany({
    where: {
      userId,
      sourceKey: directSourceKey,
      source: { not: XPSource.ACHIEVEMENT },
    },
    select: { source: true, sourceKey: true, amount: true },
    orderBy: { amount: "desc" },
  });
}

export async function getDailyGameProgression(userId: string, attemptId: string) {
  const attempt = await getDb().dailyAttempt.findFirst({
    where: { id: attemptId, userId, completedAt: { not: null } },
    select: { completedAt: true },
  });
  if (!attempt?.completedAt) return null;

  return progressionResult(
    userId,
    await rewardsForCompletion(userId, attempt.completedAt, attemptId),
  );
}

export async function getUnlimitedGameProgression(userId: string, gameId: string) {
  const attempt = await getDb().unlimitedAttempt.findFirst({
    where: { id: gameId, userId },
    select: { completedAt: true },
  });
  if (!attempt) return null;

  const [summary, dailyCap] = await Promise.all([
    progressionResult(
      userId,
      await rewardsForCompletion(userId, attempt.completedAt, gameId),
    ),
    getUnlimitedXpToday(userId),
  ]);
  return { ...summary, dailyCap };
}
