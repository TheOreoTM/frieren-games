import "server-only";

import { DailyChallengeStatus, type Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { publicFrameUrl } from "@/lib/r2";

import {
  canEditDailyComposition,
  dailyDisplayState,
} from "../domain/daily-policy";
import { selectDailyFrames } from "../domain/daily-generator";
import {
  addUtcDays,
  enumerateUtcDates,
  startOfUtcDate,
  utcDateKey,
} from "@/lib/utc-date";
import { createDailyChallenge } from "./daily-generation";

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function selectInTransaction(
  database: Prisma.TransactionClient,
  dateUtc: Date,
  usedFrameIds: ReadonlySet<string> = new Set(),
) {
  const [candidates, recentRounds] = await Promise.all([
    database.frame.findMany({
      where: { enabled: true, dailyRounds: { none: {} } },
      select: { id: true, episodeId: true, difficulty: true },
    }),
    database.dailyChallengeRound.findMany({
      where: {
        challenge: {
          dateUtc: { gte: addUtcDays(dateUtc, -14), lt: dateUtc },
          status: { not: DailyChallengeStatus.VOID },
        },
      },
      select: { frame: { select: { episodeId: true } } },
    }),
  ]);
  return selectDailyFrames(candidates, {
    usedFrameIds,
    recentEpisodeIds: new Set(
      recentRounds.map((round) => round.frame.episodeId),
    ),
  });
}

export async function generateDailyRange(
  firstDate: Date,
  lastDate: Date,
  now = new Date(),
) {
  const today = startOfUtcDate(now);
  const dates = enumerateUtcDates(firstDate, lastDate);
  if (dates.some((date) => date <= today)) {
    throw new Error("Daily generation is limited to future UTC dates.");
  }

  let created = 0;
  let skipped = 0;
  for (const date of dates) {
    const existing = await getDb().dailyChallenge.findUnique({
      where: { dateUtc: date },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    try {
      await createDailyChallenge(date, DailyChallengeStatus.DRAFT);
      created += 1;
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      skipped += 1;
    }
  }
  return { created, skipped };
}

export async function approveDaily(challengeId: string, now = new Date()) {
  await getDb().$transaction(async (database) => {
    const challenge = await database.dailyChallenge.findUnique({
      where: { id: challengeId },
      include: { rounds: true },
    });
    if (
      !challenge ||
      !canEditDailyComposition(challenge.dateUtc, challenge.status, now)
    ) {
      throw new Error("Only future non-void Dailies can be approved.");
    }
    if (challenge.rounds.length !== 5)
      throw new Error("A Daily must contain exactly five rounds.");
    await database.dailyChallenge.update({
      where: { id: challengeId },
      data: { status: DailyChallengeStatus.APPROVED, approvedAt: new Date() },
    });
  });
}

export async function regenerateDaily(challengeId: string, now = new Date()) {
  await getDb().$transaction(
    async (database) => {
      const challenge = await database.dailyChallenge.findUnique({
        where: { id: challengeId },
        include: { rounds: true },
      });
      if (
        !challenge ||
        !canEditDailyComposition(challenge.dateUtc, challenge.status, now)
      ) {
        throw new Error(
          "Active, completed, or void Dailies cannot be regenerated.",
        );
      }
      const previousFrameIds = challenge.rounds.map((round) => round.frameId);
      await database.dailyChallengeRound.deleteMany({ where: { challengeId } });
      const selected = await selectInTransaction(
        database,
        challenge.dateUtc,
        new Set(previousFrameIds),
      );
      await database.dailyChallengeRound.createMany({
        data: selected.map((frame, index) => ({
          challengeId,
          roundNumber: index + 1,
          frameId: frame.id,
        })),
      });
      await database.dailyChallenge.update({
        where: { id: challengeId },
        data: { status: DailyChallengeStatus.DRAFT, approvedAt: null },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function replaceDailyRound(
  challengeId: string,
  roundNumber: number,
  now = new Date(),
) {
  await getDb().$transaction(
    async (database) => {
      const challenge = await database.dailyChallenge.findUnique({
        where: { id: challengeId },
        include: { rounds: { include: { frame: true } } },
      });
      if (
        !challenge ||
        !canEditDailyComposition(challenge.dateUtc, challenge.status, now)
      ) {
        throw new Error("Active, completed, or void Dailies cannot be edited.");
      }
      const target = challenge.rounds.find(
        (round) => round.roundNumber === roundNumber,
      );
      if (!target) throw new Error("Daily round was not found.");
      const otherEpisodeIds = challenge.rounds
        .filter((round) => round.roundNumber !== roundNumber)
        .map((round) => round.frame.episodeId);
      const candidates = await database.frame.findMany({
        where: {
          enabled: true,
          id: { not: target.frameId },
          episodeId: { notIn: otherEpisodeIds },
          dailyRounds: { none: {} },
        },
        select: { id: true, difficulty: true },
      });
      const sameDifficulty = candidates.filter(
        (candidate) => candidate.difficulty === target.frame.difficulty,
      );
      const pool = sameDifficulty.length > 0 ? sameDifficulty : candidates;
      const replacement = pool[Math.floor(Math.random() * pool.length)];
      if (!replacement)
        throw new Error(
          "No unused frame from a distinct episode is available.",
        );

      await database.dailyChallengeRound.update({
        where: { challengeId_roundNumber: { challengeId, roundNumber } },
        data: { frameId: replacement.id },
      });
      await database.dailyChallenge.update({
        where: { id: challengeId },
        data: { status: DailyChallengeStatus.DRAFT, approvedAt: null },
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function voidDaily(challengeId: string) {
  await getDb().dailyChallenge.update({
    where: { id: challengeId },
    data: { status: DailyChallengeStatus.VOID, voidedAt: new Date() },
  });
}

export async function listAdminDailies(
  firstDate: Date,
  lastDate: Date,
  now = new Date(),
) {
  const challenges = await getDb().dailyChallenge.findMany({
    where: {
      dateUtc: {
        gte: startOfUtcDate(firstDate),
        lte: startOfUtcDate(lastDate),
      },
    },
    orderBy: { dateUtc: "asc" },
    include: {
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          frame: {
            include: {
              episode: {
                select: { season: true, episodeNumber: true, title: true },
              },
            },
          },
        },
      },
      _count: { select: { attempts: true } },
    },
  });

  return challenges.map((challenge) => ({
    ...challenge,
    dateKey: utcDateKey(challenge.dateUtc),
    displayState: dailyDisplayState(challenge.dateUtc, challenge.status, now),
    editable: canEditDailyComposition(challenge.dateUtc, challenge.status, now),
    rounds: challenge.rounds.map((round) => ({
      ...round,
      imageUrl: publicFrameUrl(round.frame.objectKey),
    })),
  }));
}
