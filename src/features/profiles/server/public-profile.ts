import "server-only";

import { DailyChallengeStatus } from "@/generated/prisma/client";
import { getUserDailyStreak } from "@/features/guessr/server/daily";
import {
  ACHIEVEMENTS,
  type AchievementId,
} from "@/features/progression/domain/achievements";
import { levelProgress } from "@/features/progression/domain/progression";
import { combineGuessStats } from "@/features/progression/domain/stats";
import { getDb } from "@/lib/db";

import { usernameSchema } from "../domain/username";

function isAchievementId(value: string): value is AchievementId {
  return value in ACHIEVEMENTS;
}

export async function getPublicProfile(username: string) {
  const parsedUsername = usernameSchema.safeParse(username);
  if (!parsedUsername.success) return null;

  const user = await getDb().user.findUnique({
    where: { username: parsedUsername.data },
    select: {
      id: true,
      username: true,
      displayName: true,
      name: true,
      image: true,
      achievements: { orderBy: { unlockedAt: "desc" } },
    },
  });
  if (!user?.username) return null;

  const rankedDailyFilter = {
    userId: user.id,
    ranked: true,
    completedAt: { not: null },
    challenge: { status: { not: DailyChallengeStatus.VOID } },
  } as const;
  const dailyGuessFilter = { attempt: rankedDailyFilter } as const;
  const unlimitedGuessFilter = { attempt: { userId: user.id } } as const;

  const [
    totalXp,
    dailyGames,
    unlimitedGames,
    dailyGuesses,
    unlimitedGuesses,
    dailyExact,
    unlimitedExact,
    bestDaily,
    recentDailies,
    streak,
  ] = await Promise.all([
    getDb().xPTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    }),
    getDb().dailyAttempt.count({ where: rankedDailyFilter }),
    getDb().unlimitedAttempt.count({ where: { userId: user.id } }),
    getDb().dailyRoundGuess.aggregate({
      where: dailyGuessFilter,
      _count: { _all: true },
      _sum: { distance: true },
    }),
    getDb().unlimitedRoundGuess.aggregate({
      where: unlimitedGuessFilter,
      _count: { _all: true },
      _sum: { distance: true },
    }),
    getDb().dailyRoundGuess.count({
      where: { ...dailyGuessFilter, distance: 0 },
    }),
    getDb().unlimitedRoundGuess.count({
      where: { ...unlimitedGuessFilter, distance: 0 },
    }),
    getDb().dailyAttempt.aggregate({
      where: rankedDailyFilter,
      _max: { totalScore: true },
    }),
    getDb().dailyAttempt.findMany({
      where: rankedDailyFilter,
      orderBy: { completedAt: "desc" },
      take: 5,
      select: { totalScore: true, challenge: { select: { dateUtc: true } } },
    }),
    getUserDailyStreak(user.id),
  ]);

  const stats = combineGuessStats(
    {
      gamesPlayed: dailyGames,
      guesses: dailyGuesses._count._all,
      exactGuesses: dailyExact,
      totalDistance: dailyGuesses._sum.distance ?? 0,
    },
    {
      gamesPlayed: unlimitedGames,
      guesses: unlimitedGuesses._count._all,
      exactGuesses: unlimitedExact,
      totalDistance: unlimitedGuesses._sum.distance ?? 0,
    },
  );
  const xp = totalXp._sum.amount ?? 0;

  return {
    displayName: user.displayName ?? user.name ?? user.username,
    username: user.username,
    avatarUrl: user.image ? `/api/avatar/${user.id}` : null,
    totalXp: xp,
    level: levelProgress(xp),
    stats: {
      ...stats,
      currentDailyStreak: streak,
      bestDailyScore: bestDaily._max.totalScore ?? 0,
      dailyGamesPlayed: dailyGames,
      unlimitedGamesPlayed: unlimitedGames,
    },
    recentDailies,
    achievements: user.achievements.flatMap((unlock) =>
      isAchievementId(unlock.achievementId)
        ? [
            {
              id: unlock.achievementId,
              ...ACHIEVEMENTS[unlock.achievementId],
              unlockedAt: unlock.unlockedAt,
            },
          ]
        : [],
    ),
  };
}
