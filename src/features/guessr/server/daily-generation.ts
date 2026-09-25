import "server-only";

import { DailyChallengeStatus, type Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

import { ensurePersistedDaily } from "../domain/daily-fallback";
import { selectDailyFrames } from "../domain/daily-generator";
import {
  addUtcDays,
  parseUtcDateKey,
  startOfUtcDate,
  utcDateKey,
} from "@/lib/utc-date";

const dailyWithRounds = {
  rounds: { orderBy: { roundNumber: "asc" as const } },
} satisfies Prisma.DailyChallengeInclude;

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function isRetryableGenerationConflict(error: unknown): boolean {
  return (
    isUniqueConflict(error) ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034")
  );
}

async function createChallenge(dateUtc: Date, status: DailyChallengeStatus) {
  return getDb().$transaction(
    async (database) => {
      const recentSince = addUtcDays(dateUtc, -14);
      const [candidates, recentRounds] = await Promise.all([
        database.frame.findMany({
          where: { enabled: true, dailyRounds: { none: {} } },
          select: { id: true, episodeId: true, difficulty: true },
        }),
        database.dailyChallengeRound.findMany({
          where: {
            challenge: {
              dateUtc: { gte: recentSince, lt: dateUtc },
              status: { not: DailyChallengeStatus.VOID },
            },
          },
          select: { frame: { select: { episodeId: true } } },
        }),
      ]);

      const selected = selectDailyFrames(candidates, {
        recentEpisodeIds: new Set(
          recentRounds.map((round) => round.frame.episodeId),
        ),
      });

      return database.dailyChallenge.create({
        data: {
          dateUtc,
          status,
          approvedAt:
            status === DailyChallengeStatus.APPROVED ? new Date() : null,
          rounds: {
            create: selected.map((frame, index) => ({
              roundNumber: index + 1,
              frameId: frame.id,
            })),
          },
        },
        include: dailyWithRounds,
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function createDailyChallenge(
  dateUtc: Date,
  status: DailyChallengeStatus,
) {
  const date = startOfUtcDate(dateUtc);
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await createChallenge(date, status);
    } catch (error) {
      lastError = error;
      if (!isRetryableGenerationConflict(error)) throw error;
    }
  }
  throw lastError;
}

export async function ensureCurrentDaily(now = new Date()) {
  const dateKey = utcDateKey(now);
  return ensurePersistedDaily(dateKey, {
    async find(key) {
      const existing = await getDb().dailyChallenge.findUnique({
        where: { dateUtc: parseUtcDateKey(key) },
        include: dailyWithRounds,
      });
      if (existing?.status === DailyChallengeStatus.DRAFT) {
        return getDb().dailyChallenge.update({
          where: { id: existing.id },
          data: {
            status: DailyChallengeStatus.APPROVED,
            approvedAt: new Date(),
          },
          include: dailyWithRounds,
        });
      }
      return existing;
    },
    async create(key) {
      return createDailyChallenge(
        parseUtcDateKey(key),
        DailyChallengeStatus.APPROVED,
      );
    },
    isDateConflict: isUniqueConflict,
  });
}
