import "server-only";

import { randomUUID } from "node:crypto";

import { getDb } from "@/lib/db";
import { publicFrameUrl } from "@/lib/r2";

import { episodeDistance } from "../domain/episode-distance";
import { selectUnlimitedFrames } from "../domain/frame-selection";
import { isReservedForUnlimited } from "../domain/daily-policy";
import { scoreEpisodeDistance, STANDARD_ROUND_COUNT } from "../domain/score";
import type { UnlimitedSession } from "../domain/session-token";
import { startOfUtcDate } from "@/lib/utc-date";

export type EpisodeOption = {
  id: number;
  season: number;
  episodeNumber: number;
  title: string;
};

export type RoundReveal = {
  score: number;
  distance: number;
  timestampMs: number;
  guessed: {
    season: number;
    episodeNumber: number;
    globalOrder: number;
  };
  correct: {
    season: number;
    episodeNumber: number;
    globalOrder: number;
    title: string;
  };
  sequence: {
    firstGlobalOrder: number;
    lastGlobalOrder: number;
  };
};

async function episodeSequenceBounds() {
  const aggregate = await getDb().episode.aggregate({
    _min: { globalOrder: true },
    _max: { globalOrder: true },
  });
  return {
    firstGlobalOrder: aggregate._min.globalOrder ?? 1,
    lastGlobalOrder: aggregate._max.globalOrder ?? 1,
  };
}

export async function createUnlimitedSession(): Promise<UnlimitedSession> {
  const todayUtc = startOfUtcDate(new Date());
  const eligibleFrames = await getDb().frame.findMany({
    where: { enabled: true },
    select: {
      id: true,
      episodeId: true,
      dailyRounds: {
        where: { challenge: { dateUtc: { gte: todayUtc } } },
        select: { challenge: { select: { dateUtc: true, status: true } } },
      },
    },
  });
  const selected = selectUnlimitedFrames(
    eligibleFrames.filter(
      (frame) =>
        !isReservedForUnlimited(
          frame.dailyRounds.map((round) => round.challenge),
          todayUtc,
        ),
    ),
    STANDARD_ROUND_COUNT,
  );

  return {
    version: 1,
    gameId: randomUUID(),
    issuedAt: Date.now(),
    frameIds: selected.map((frame) => frame.id),
    currentRound: 0,
    guesses: [],
  };
}

export async function listEpisodeOptions(): Promise<EpisodeOption[]> {
  return getDb().episode.findMany({
    orderBy: { globalOrder: "asc" },
    select: { id: true, season: true, episodeNumber: true, title: true },
  });
}

export async function scoreRound(
  frameId: string,
  guessedEpisodeId: number,
): Promise<RoundReveal> {
  const [frame, guessed, sequence] = await Promise.all([
    getDb().frame.findUnique({
      where: { id: frameId },
      select: {
        timestampMs: true,
        episode: {
          select: {
            season: true,
            episodeNumber: true,
            globalOrder: true,
            title: true,
          },
        },
      },
    }),
    getDb().episode.findUnique({
      where: { id: guessedEpisodeId },
      select: { season: true, episodeNumber: true, globalOrder: true },
    }),
    episodeSequenceBounds(),
  ]);

  if (!frame || !guessed)
    throw new Error("The selected round or episode is unavailable.");
  const distance = episodeDistance(
    frame.episode.globalOrder,
    guessed.globalOrder,
  );

  return {
    score: scoreEpisodeDistance(distance),
    distance,
    timestampMs: frame.timestampMs,
    guessed,
    correct: frame.episode,
    sequence,
  };
}

export async function getRoundPageData(session: UnlimitedSession) {
  if (session.currentRound >= STANDARD_ROUND_COUNT) return null;
  const frameId = session.frameIds[session.currentRound];
  const [frame, episodes] = await Promise.all([
    getDb().frame.findUnique({
      where: { id: frameId },
      select: { objectKey: true, width: true, height: true },
    }),
    listEpisodeOptions(),
  ]);
  if (!frame)
    throw new Error("This game contains a frame that is no longer available.");

  const submittedGuess = session.guesses[session.currentRound];
  const reveal = submittedGuess
    ? await scoreRound(frameId, submittedGuess.guessedEpisodeId)
    : null;

  return {
    gameId: session.gameId,
    roundNumber: session.currentRound + 1,
    roundCount: STANDARD_ROUND_COUNT,
    imageUrl: publicFrameUrl(frame.objectKey),
    imageWidth: frame.width,
    imageHeight: frame.height,
    episodes,
    runningTotal: session.guesses.reduce((sum, guess) => sum + guess.score, 0),
    reveal,
  };
}

export async function getGameResults(session: UnlimitedSession) {
  if (
    session.currentRound !== STANDARD_ROUND_COUNT ||
    session.guesses.length !== STANDARD_ROUND_COUNT
  ) {
    throw new Error("Unlimited game is not complete.");
  }

  const rounds = await Promise.all(
    session.guesses.map(async (guess, index) => {
      const reveal = await scoreRound(
        session.frameIds[index],
        guess.guessedEpisodeId,
      );
      return {
        roundNumber: index + 1,
        score: reveal.score,
        distance: reveal.distance,
        guessed: reveal.guessed,
        correct: reveal.correct,
      };
    }),
  );

  return {
    totalScore: rounds.reduce((total, round) => total + round.score, 0),
    rounds,
  };
}
