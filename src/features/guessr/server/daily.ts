import "server-only";

import { DailyChallengeStatus } from "@/generated/prisma/client";
import { ensureDailyProgression } from "@/features/progression/server/progression";
import { getDb } from "@/lib/db";
import { publicFrameUrl } from "@/lib/r2";

import { dailyAttemptPlan } from "../domain/daily-policy";
import { calculateDailyStreak } from "../domain/daily-streak";
import { assignSharedRanks } from "../domain/leaderboard";
import { STANDARD_ROUND_COUNT } from "../domain/score";
import { startOfUtcDate, utcDateKey } from "../domain/utc-date";
import { ensureCurrentDaily } from "./daily-generation";
import { listEpisodeOptions, scoreRound } from "./game";

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function getTodayDailyOverview(userId: string, now = new Date()) {
  const challenge = await ensureCurrentDaily(now);
  const rankedAttempt = await getDb().dailyAttempt.findFirst({
    where: { userId, challengeId: challenge.id, ranked: true },
    select: { id: true, currentRound: true, completedAt: true, totalScore: true },
  });

  return {
    challenge,
    rankedAttempt,
    streak: await getUserDailyStreak(userId, now, challenge.id),
  };
}

export async function startOrResumeDailyAttempt(userId: string, now = new Date()) {
  const challenge = await ensureCurrentDaily(now);
  if (challenge.status === DailyChallengeStatus.VOID) {
    throw new Error("Today's Daily has been voided.");
  }
  if (challenge.status !== DailyChallengeStatus.APPROVED) {
    throw new Error("Today's Daily is not ready.");
  }

  const rankedAttempt = await getDb().dailyAttempt.findFirst({
    where: { userId, challengeId: challenge.id, ranked: true },
  });
  const plan = dailyAttemptPlan(
    rankedAttempt ? { completed: Boolean(rankedAttempt.completedAt) } : null,
  );
  if (plan === "RESUME_RANKED" && rankedAttempt) return rankedAttempt;

  const ranked = plan === "CREATE_RANKED";
  try {
    return await getDb().dailyAttempt.create({
      data: { userId, challengeId: challenge.id, ranked },
    });
  } catch (error) {
    if (!ranked || !isUniqueConflict(error)) throw error;
    const winner = await getDb().dailyAttempt.findFirst({
      where: { userId, challengeId: challenge.id, ranked: true },
    });
    if (!winner) throw error;
    return winner;
  }
}

async function ownedAttempt(userId: string, attemptId: string) {
  return getDb().dailyAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      challenge: {
        include: {
          rounds: {
            orderBy: { roundNumber: "asc" },
            include: { frame: { select: { objectKey: true, width: true, height: true } } },
          },
        },
      },
      guesses: { orderBy: { roundNumber: "asc" } },
    },
  });
}

export async function getDailyAttemptPageData(userId: string, attemptId: string) {
  const attempt = await ownedAttempt(userId, attemptId);
  if (!attempt) return null;
  if (attempt.challenge.status === DailyChallengeStatus.VOID) {
    return { kind: "void" as const, attempt };
  }
  if (
    attempt.ranked &&
    !attempt.completedAt &&
    utcDateKey(attempt.challenge.dateUtc) !== utcDateKey(new Date())
  ) {
    return { kind: "expired" as const, attempt };
  }
  if (attempt.currentRound === STANDARD_ROUND_COUNT && attempt.completedAt) {
    return { kind: "complete" as const, attempt };
  }

  const round = attempt.challenge.rounds[attempt.currentRound];
  if (!round) throw new Error("Daily challenge composition is incomplete.");
  const existingGuess = attempt.guesses.find(
    (guess) => guess.roundNumber === round.roundNumber,
  );
  const [episodes, reveal] = await Promise.all([
    listEpisodeOptions(),
    existingGuess
      ? scoreRound(round.frameId, existingGuess.guessedEpisodeId)
      : Promise.resolve(null),
  ]);

  return {
    kind: "round" as const,
    attemptId: attempt.id,
    ranked: attempt.ranked,
    dateKey: utcDateKey(attempt.challenge.dateUtc),
    roundNumber: round.roundNumber,
    roundCount: STANDARD_ROUND_COUNT,
    imageUrl: publicFrameUrl(round.frame.objectKey),
    imageWidth: round.frame.width,
    imageHeight: round.frame.height,
    episodes,
    runningTotal: attempt.totalScore,
    reveal,
  };
}

export async function submitDailyRound(
  userId: string,
  attemptId: string,
  guessedEpisodeId: number,
) {
  const attempt = await ownedAttempt(userId, attemptId);
  if (!attempt || attempt.completedAt || attempt.currentRound >= STANDARD_ROUND_COUNT) {
    throw new Error("This Daily attempt is unavailable.");
  }
  if (attempt.challenge.status === DailyChallengeStatus.VOID) {
    throw new Error("This Daily has been voided.");
  }
  if (attempt.ranked && utcDateKey(attempt.challenge.dateUtc) !== utcDateKey(new Date())) {
    throw new Error("This ranked attempt expired at the 00:00 UTC reset.");
  }

  const round = attempt.challenge.rounds[attempt.currentRound];
  if (!round) throw new Error("Daily challenge composition is incomplete.");
  const existingGuess = attempt.guesses.find(
    (guess) => guess.roundNumber === round.roundNumber,
  );
  if (existingGuess) return scoreRound(round.frameId, existingGuess.guessedEpisodeId);

  const reveal = await scoreRound(round.frameId, guessedEpisodeId);
  try {
    await getDb().$transaction(async (database) => {
      await database.dailyRoundGuess.create({
        data: {
          attemptId,
          roundNumber: round.roundNumber,
          frameId: round.frameId,
          guessedEpisodeId,
          distance: reveal.distance,
          score: reveal.score,
        },
      });
      const updated = await database.dailyAttempt.updateMany({
        where: {
          id: attemptId,
          userId,
          currentRound: attempt.currentRound,
          completedAt: null,
        },
        data: { totalScore: { increment: reveal.score } },
      });
      if (updated.count !== 1) throw new Error("Daily attempt changed during submission.");
    });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const saved = await getDb().dailyRoundGuess.findUnique({
      where: { attemptId_roundNumber: { attemptId, roundNumber: round.roundNumber } },
    });
    if (!saved) throw error;
    return scoreRound(saved.frameId, saved.guessedEpisodeId);
  }
  return reveal;
}

export async function advanceDailyAttempt(userId: string, attemptId: string) {
  const attempt = await ownedAttempt(userId, attemptId);
  if (!attempt || attempt.completedAt || attempt.currentRound >= STANDARD_ROUND_COUNT) {
    throw new Error("This Daily attempt cannot advance.");
  }
  if (attempt.challenge.status === DailyChallengeStatus.VOID) {
    throw new Error("This Daily has been voided.");
  }
  if (attempt.ranked && utcDateKey(attempt.challenge.dateUtc) !== utcDateKey(new Date())) {
    throw new Error("This ranked attempt expired at the 00:00 UTC reset.");
  }
  const roundNumber = attempt.currentRound + 1;
  if (!attempt.guesses.some((guess) => guess.roundNumber === roundNumber)) {
    throw new Error("Submit a guess before advancing.");
  }
  const nextRound = attempt.currentRound + 1;
  const updated = await getDb().dailyAttempt.updateMany({
    where: { id: attemptId, userId, currentRound: attempt.currentRound, completedAt: null },
    data: {
      currentRound: nextRound,
      completedAt: nextRound === STANDARD_ROUND_COUNT ? new Date() : undefined,
    },
  });
  if (updated.count !== 1) throw new Error("Daily attempt changed while advancing.");
  if (nextRound === STANDARD_ROUND_COUNT && attempt.ranked) {
    await ensureDailyProgression(userId, attemptId);
  }
}

export async function getDailyResults(userId: string, attemptId: string) {
  await ensureDailyProgression(userId, attemptId);
  const attempt = await getDb().dailyAttempt.findFirst({
    where: { id: attemptId, userId, completedAt: { not: null } },
    include: {
      challenge: true,
      guesses: {
        orderBy: { roundNumber: "asc" },
        include: {
          guessedEpisode: { select: { season: true, episodeNumber: true } },
          frame: {
            select: {
              episode: { select: { season: true, episodeNumber: true, title: true } },
            },
          },
        },
      },
    },
  });
  if (!attempt) return null;

  return {
    id: attempt.id,
    ranked: attempt.ranked,
    void: attempt.challenge.status === DailyChallengeStatus.VOID,
    dateKey: utcDateKey(attempt.challenge.dateUtc),
    totalScore: attempt.totalScore,
    rounds: attempt.guesses.map((guess) => ({
      roundNumber: guess.roundNumber,
      score: guess.score,
      distance: guess.distance,
      guessed: guess.guessedEpisode,
      correct: guess.frame.episode,
    })),
  };
}

export async function getDailyLeaderboard(dateUtc: Date) {
  const normalizedDate = startOfUtcDate(dateUtc);
  const challenge =
    utcDateKey(normalizedDate) === utcDateKey(new Date())
      ? await ensureCurrentDaily()
      : await getDb().dailyChallenge.findUnique({ where: { dateUtc: normalizedDate } });
  if (!challenge || challenge.status === DailyChallengeStatus.VOID) {
    return { challenge, entries: [] };
  }
  const attempts = await getDb().dailyAttempt.findMany({
    where: { challengeId: challenge.id, ranked: true, completedAt: { not: null } },
    select: {
      id: true,
      totalScore: true,
      user: { select: { id: true, username: true, displayName: true, name: true, image: true } },
    },
  });
  const entries = assignSharedRanks(
    attempts.map((attempt) => ({
      attemptId: attempt.id,
      totalScore: attempt.totalScore,
      username: attempt.user.username,
      displayName: attempt.user.displayName ?? attempt.user.name ?? attempt.user.username ?? "Traveler",
      avatarUrl: attempt.user.image ? `/api/avatar/${attempt.user.id}` : null,
    })),
  );
  return { challenge, entries };
}

export async function getDailyLeaderboardNavigation(dateUtc: Date) {
  const date = startOfUtcDate(dateUtc);
  const [previous, next] = await Promise.all([
    getDb().dailyChallenge.findFirst({
      where: { dateUtc: { lt: date } },
      orderBy: { dateUtc: "desc" },
      select: { dateUtc: true },
    }),
    getDb().dailyChallenge.findFirst({
      where: { dateUtc: { gt: date, lte: startOfUtcDate(new Date()) } },
      orderBy: { dateUtc: "asc" },
      select: { dateUtc: true },
    }),
  ]);
  return {
    previousDateKey: previous ? utcDateKey(previous.dateUtc) : null,
    nextDateKey: next ? utcDateKey(next.dateUtc) : null,
  };
}

export async function getUserDailyStreak(
  userId: string,
  now = new Date(),
  currentChallengeId?: string,
) {
  const today = startOfUtcDate(now);
  const [challenges, completions] = await Promise.all([
    getDb().dailyChallenge.findMany({
      where: { dateUtc: { lte: today }, status: { not: DailyChallengeStatus.VOID } },
      orderBy: { dateUtc: "asc" },
      select: { id: true, dateUtc: true },
    }),
    getDb().dailyAttempt.findMany({
      where: {
        userId,
        ranked: true,
        completedAt: { not: null },
        challenge: { status: { not: DailyChallengeStatus.VOID } },
      },
      select: { challengeId: true },
    }),
  ]);
  return calculateDailyStreak(
    challenges.map((challenge) => challenge.id),
    new Set(completions.map((attempt) => attempt.challengeId)),
    currentChallengeId ??
      challenges.find((challenge) => utcDateKey(challenge.dateUtc) === utcDateKey(today))?.id,
  );
}
