"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import {
  createUnlimitedSession,
  getGameResults,
  scoreRound,
} from "@/features/guessr/server/game";
import type { GuessActionState } from "@/features/guessr/components/game-round";
import {
  readUnlimitedSession,
  writeUnlimitedSession,
} from "@/features/guessr/server/session";
import { recordUnlimitedCompletion } from "@/features/progression/server/progression";

export type { GuessActionState };

export async function startUnlimitedGame() {
  await writeUnlimitedSession(await createUnlimitedSession());
  redirect("/guessr/play");
}

export async function submitUnlimitedGuess(
  _previousState: GuessActionState,
  formData: FormData,
): Promise<GuessActionState> {
  const parsed = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(formData.get("episodeId"));
  if (!parsed.success)
    return { reveal: null, error: "Choose an episode before locking in." };

  const session = await readUnlimitedSession();
  if (!session || session.currentRound >= session.frameIds.length) {
    return { reveal: null, error: "This game has expired. Start a new game." };
  }

  const existingGuess = session.guesses[session.currentRound];
  if (existingGuess) {
    return {
      reveal: await scoreRound(
        session.frameIds[session.currentRound],
        existingGuess.guessedEpisodeId,
      ),
      error: null,
    };
  }

  try {
    const reveal = await scoreRound(
      session.frameIds[session.currentRound],
      parsed.data,
    );
    session.guesses.push({
      guessedEpisodeId: parsed.data,
      distance: reveal.distance,
      score: reveal.score,
    });
    await writeUnlimitedSession(session);
    return { reveal, error: null };
  } catch {
    return {
      reveal: null,
      error: "That guess could not be scored. Please try again.",
    };
  }
}

export async function advanceUnlimitedRound() {
  const session = await readUnlimitedSession();
  if (!session) redirect("/guessr");
  if (session.currentRound >= session.frameIds.length) redirect("/guessr/play");
  if (session.guesses.length !== session.currentRound + 1) {
    throw new Error("Submit a guess before advancing the round.");
  }

  session.currentRound += 1;
  if (session.currentRound === session.frameIds.length) {
    const account = await auth();
    if (account?.user?.id) {
      const results = await getGameResults(session);
      await recordUnlimitedCompletion(account.user.id, {
        id: session.gameId,
        totalScore: results.totalScore,
        rounds: results.rounds.map((round, index) => ({
          roundNumber: round.roundNumber,
          frameId: session.frameIds[index],
          guessedEpisodeId: session.guesses[index].guessedEpisodeId,
          distance: round.distance,
          score: round.score,
        })),
      });
    }
  }
  await writeUnlimitedSession(session);
  redirect("/guessr/play");
}
