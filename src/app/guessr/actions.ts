"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createUnlimitedSession,
  scoreRound,
  type RoundReveal,
} from "@/features/guessr/server/game";
import {
  readUnlimitedSession,
  writeUnlimitedSession,
} from "@/features/guessr/server/session";

export type GuessActionState = {
  reveal: RoundReveal | null;
  error: string | null;
};

export async function startUnlimitedGame() {
  await writeUnlimitedSession(await createUnlimitedSession());
  redirect("/guessr/play");
}

export async function submitUnlimitedGuess(
  _previousState: GuessActionState,
  formData: FormData,
): Promise<GuessActionState> {
  const parsed = z.coerce.number().int().positive().safeParse(formData.get("episodeId"));
  if (!parsed.success) return { reveal: null, error: "Choose an episode before locking in." };

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
    const reveal = await scoreRound(session.frameIds[session.currentRound], parsed.data);
    session.guesses.push({
      guessedEpisodeId: parsed.data,
      distance: reveal.distance,
      score: reveal.score,
    });
    await writeUnlimitedSession(session);
    return { reveal, error: null };
  } catch {
    return { reveal: null, error: "That guess could not be scored. Please try again." };
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
  await writeUnlimitedSession(session);
  redirect("/guessr/play");
}
