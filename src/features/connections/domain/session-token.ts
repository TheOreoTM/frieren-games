import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import {
  CONNECTIONS_GROUP_COUNT,
  CONNECTIONS_MAX_MISTAKES,
  type ConnectionsAttemptState,
} from "./types";

const TOKEN_PURPOSE = "connections-anonymous-v1";
const TOKEN_MAX_AGE_MS = 48 * 60 * 60 * 1_000;

const attemptStateSchema = z
  .object({
    status: z.enum(["IN_PROGRESS", "SOLVED", "FAILED"]),
    solvedGroupIds: z
      .array(z.string().min(1).max(64))
      .max(CONNECTIONS_GROUP_COUNT),
    incorrectSubmissionSignatures: z
      .array(z.string().min(1).max(512))
      .max(CONNECTIONS_MAX_MISTAKES),
    mistakes: z.number().int().min(0).max(CONNECTIONS_MAX_MISTAKES),
  })
  .superRefine((state, context) => {
    if (new Set(state.solvedGroupIds).size !== state.solvedGroupIds.length) {
      context.addIssue({
        code: "custom",
        path: ["solvedGroupIds"],
        message: "must be unique",
      });
    }
    if (
      state.status === "SOLVED" &&
      state.solvedGroupIds.length !== CONNECTIONS_GROUP_COUNT
    ) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "requires all groups to be solved",
      });
    }
    if (
      state.status === "FAILED" &&
      state.mistakes !== CONNECTIONS_MAX_MISTAKES
    ) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "requires the maximum mistake count",
      });
    }
    if (
      state.status === "IN_PROGRESS" &&
      (state.solvedGroupIds.length === CONNECTIONS_GROUP_COUNT ||
        state.mistakes === CONNECTIONS_MAX_MISTAKES)
    ) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "cannot already meet a terminal condition",
      });
    }
  });

export const anonymousConnectionsSessionSchema = z.object({
  version: z.literal(1),
  attemptId: z.string().uuid(),
  puzzleId: z.string().min(1).max(64),
  issuedAt: z.number().int().positive(),
  state: attemptStateSchema,
});

export type AnonymousConnectionsSession = z.infer<
  typeof anonymousConnectionsSessionSchema
>;

export function createAnonymousConnectionsSession(
  puzzleId: string,
  state: ConnectionsAttemptState,
  now = Date.now(),
): AnonymousConnectionsSession {
  return anonymousConnectionsSessionSchema.parse({
    version: 1,
    attemptId: randomUUID(),
    puzzleId,
    issuedAt: now,
    state,
  });
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${TOKEN_PURPOSE}.${payload}`)
    .digest("base64url");
}

export function signAnonymousConnectionsSession(
  session: AnonymousConnectionsSession,
  secret: string,
): string {
  const validated = anonymousConnectionsSessionSchema.parse(session);
  const payload = Buffer.from(JSON.stringify(validated)).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyAnonymousConnectionsSession(
  token: string,
  secret: string,
  now = Date.now(),
): AnonymousConnectionsSession | null {
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
    const session = anonymousConnectionsSessionSchema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    if (
      session.issuedAt > now + 60_000 ||
      now - session.issuedAt > TOKEN_MAX_AGE_MS
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
