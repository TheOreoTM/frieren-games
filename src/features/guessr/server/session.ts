import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import {
  signUnlimitedSession,
  type UnlimitedSession,
  verifyUnlimitedSession,
} from "../domain/session-token";

const COOKIE_NAME = "frieren_guessr_unlimited";
const COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

function sessionSecret() {
  return z
    .string()
    .min(32, "GUESSR_SESSION_SECRET must contain at least 32 characters.")
    .parse(process.env.GUESSR_SESSION_SECRET);
}

export async function readUnlimitedSession(): Promise<UnlimitedSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyUnlimitedSession(token, sessionSecret());
}

export async function writeUnlimitedSession(session: UnlimitedSession) {
  (await cookies()).set(
    COOKIE_NAME,
    signUnlimitedSession(session, sessionSecret()),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/guessr",
      maxAge: COOKIE_MAX_AGE_SECONDS,
      priority: "high",
    },
  );
}
