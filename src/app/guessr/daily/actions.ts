"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import type { GuessActionState } from "@/features/guessr/components/game-round";
import {
  advanceDailyAttempt,
  startOrResumeDailyAttempt,
  submitDailyRound,
} from "@/features/guessr/server/daily";

async function requireDailyUser() {
  const session = await auth();
  if (!session?.user?.id)
    redirect("/api/auth/signin?callbackUrl=/guessr/daily");
  return session.user.id;
}

export async function startDailyGame() {
  const userId = await requireDailyUser();
  const attempt = await startOrResumeDailyAttempt(userId);
  redirect(`/guessr/daily?attempt=${attempt.id}`);
}

export async function submitDailyGuess(
  attemptId: string,
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

  try {
    const userId = await requireDailyUser();
    return {
      reveal: await submitDailyRound(userId, attemptId, parsed.data),
      error: null,
    };
  } catch (error) {
    return {
      reveal: null,
      error:
        error instanceof Error
          ? error.message
          : "That guess could not be scored.",
    };
  }
}

export async function advanceDailyRound(attemptId: string) {
  const userId = await requireDailyUser();
  await advanceDailyAttempt(userId, attemptId);
  redirect(`/guessr/daily?attempt=${attemptId}`);
}
