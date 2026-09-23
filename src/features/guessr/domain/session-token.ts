import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { STANDARD_ROUND_COUNT } from "./score";

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

const roundGuessSchema = z.object({
  guessedEpisodeId: z.number().int().positive(),
  distance: z.number().int().nonnegative(),
  score: z.number().int().min(0).max(5_000),
});

export const unlimitedSessionSchema = z
  .object({
    version: z.literal(1),
    gameId: z.string().uuid(),
    issuedAt: z.number().int().positive(),
    frameIds: z.array(z.string().regex(/^[a-f0-9]{32}$/)).length(STANDARD_ROUND_COUNT),
    currentRound: z.number().int().min(0).max(STANDARD_ROUND_COUNT),
    guesses: z.array(roundGuessSchema).max(STANDARD_ROUND_COUNT),
  })
  .superRefine((session, context) => {
    const validGuessCount =
      session.guesses.length === session.currentRound ||
      (session.currentRound < STANDARD_ROUND_COUNT &&
        session.guesses.length === session.currentRound + 1);
    if (!validGuessCount) {
      context.addIssue({
        code: "custom",
        path: ["guesses"],
        message: "does not match the current round",
      });
    }

    if (new Set(session.frameIds).size !== session.frameIds.length) {
      context.addIssue({ code: "custom", path: ["frameIds"], message: "must be unique" });
    }
  });

export type UnlimitedSession = z.infer<typeof unlimitedSessionSchema>;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signUnlimitedSession(session: UnlimitedSession, secret: string) {
  const validated = unlimitedSessionSchema.parse(session);
  const payload = Buffer.from(JSON.stringify(validated)).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyUnlimitedSession(
  token: string,
  secret: string,
  now = Date.now(),
): UnlimitedSession | null {
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;

  const expectedSignature = signature(payload, secret);
  const suppliedBytes = Buffer.from(suppliedSignature);
  const expectedBytes = Buffer.from(expectedSignature);
  if (
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  ) {
    return null;
  }

  try {
    const parsed = unlimitedSessionSchema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    if (parsed.issuedAt > now + 60_000 || now - parsed.issuedAt > TOKEN_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
