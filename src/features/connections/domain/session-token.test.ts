import { describe, expect, it } from "vitest";

import { createConnectionsAttemptState } from "./attempt";
import {
  anonymousConnectionsSessionSchema,
  createAnonymousConnectionsSession,
  signAnonymousConnectionsSession,
  verifyAnonymousConnectionsSession,
} from "./session-token";

const secret = "connections-test-secret-that-is-at-least-32-characters";
const now = Date.UTC(2026, 8, 25, 12);

describe("anonymous Connections session tokens", () => {
  it("round-trips answer-safe attempt progress", () => {
    const session = createAnonymousConnectionsSession(
      "puzzle-1",
      createConnectionsAttemptState(),
      now,
    );

    expect(
      verifyAnonymousConnectionsSession(
        signAnonymousConnectionsSession(session, secret),
        secret,
        now,
      ),
    ).toEqual(session);
  });

  it("rejects tampering and expired tokens", () => {
    const session = createAnonymousConnectionsSession(
      "puzzle-1",
      createConnectionsAttemptState(),
      now,
    );
    const token = signAnonymousConnectionsSession(session, secret);

    expect(
      verifyAnonymousConnectionsSession(`${token}x`, secret, now),
    ).toBeNull();
    expect(
      verifyAnonymousConnectionsSession(
        token,
        secret,
        now + 49 * 60 * 60 * 1_000,
      ),
    ).toBeNull();
  });

  it("rejects attempt states that contradict their terminal status", () => {
    expect(
      anonymousConnectionsSessionSchema.safeParse({
        version: 1,
        attemptId: "2ec47560-9aaf-4ec4-a560-e973f6627e9e",
        puzzleId: "puzzle-1",
        issuedAt: now,
        state: {
          ...createConnectionsAttemptState(),
          status: "SOLVED",
        },
      }).success,
    ).toBe(false);
  });
});
