import { describe, expect, it } from "vitest";

import {
  signUnlimitedSession,
  type UnlimitedSession,
  verifyUnlimitedSession,
} from "./session-token";

const now = Date.UTC(2026, 8, 23);
const secret = "a-secure-test-secret-with-at-least-32-characters";
const session: UnlimitedSession = {
  version: 1,
  gameId: "8cc48fd4-cada-4854-9438-e8f754c84523",
  issuedAt: now,
  frameIds: [
    "00000000000000000000000000000000", "11111111111111111111111111111111",
    "22222222222222222222222222222222", "33333333333333333333333333333333",
    "44444444444444444444444444444444",
  ],
  currentRound: 0,
  guesses: [],
};

describe("Unlimited session token", () => {
  it("round-trips a valid server session", () => {
    expect(verifyUnlimitedSession(signUnlimitedSession(session, secret), secret, now)).toEqual(session);
  });

  it("rejects payload tampering", () => {
    const token = signUnlimitedSession(session, secret);
    const [payload, tokenSignature] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    decoded.currentRound = 5;
    const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString("base64url");
    expect(verifyUnlimitedSession(`${tamperedPayload}.${tokenSignature}`, secret, now)).toBeNull();
  });

  it("expires after 24 hours", () => {
    const token = signUnlimitedSession(session, secret);
    expect(verifyUnlimitedSession(token, secret, now + 24 * 60 * 60 * 1_000 + 1)).toBeNull();
  });
});
