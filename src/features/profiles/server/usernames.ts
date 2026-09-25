import "server-only";

import { getDb } from "@/lib/db";

import { normalizeUsername, suffixedUsername } from "../domain/username";
import { usernameCollisionSuffix } from "../domain/username-collision";

export async function findAvailableUsername(
  preferredUsername: string,
  providerAccountId: string,
): Promise<string> {
  const base = normalizeUsername(preferredUsername);
  const candidates = [
    base,
    ...[6, 8, 10, 12].map((length) =>
      suffixedUsername(
        base,
        usernameCollisionSuffix(providerAccountId, length),
      ),
    ),
  ];
  const existing = await getDb().user.findMany({
    where: { username: { in: candidates } },
    select: { username: true },
  });
  const taken = new Set(
    existing.flatMap((user) => (user.username ? [user.username] : [])),
  );
  const available = candidates.find((candidate) => !taken.has(candidate));
  if (available) return available;

  throw new Error("Unable to reserve an available username suggestion.");
}
