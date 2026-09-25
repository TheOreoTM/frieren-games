import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import {
  signAnonymousConnectionsSession,
  type AnonymousConnectionsSession,
  verifyAnonymousConnectionsSession,
} from "../domain/session-token";

const COOKIE_NAME = "magic_in_passing_connections";
const COOKIE_MAX_AGE_SECONDS = 48 * 60 * 60;

function sessionSecret(): string {
  return z
    .string()
    .min(32, "GUESSR_SESSION_SECRET must contain at least 32 characters.")
    .parse(process.env.GUESSR_SESSION_SECRET);
}

export async function readAnonymousConnectionsSession(): Promise<AnonymousConnectionsSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAnonymousConnectionsSession(token, sessionSecret());
}

export async function writeAnonymousConnectionsSession(
  session: AnonymousConnectionsSession,
): Promise<void> {
  (await cookies()).set(
    COOKIE_NAME,
    signAnonymousConnectionsSession(session, sessionSecret()),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/connections",
      maxAge: COOKIE_MAX_AGE_SECONDS,
      priority: "high",
    },
  );
}
