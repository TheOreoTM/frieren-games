import { createHash } from "node:crypto";

export function usernameCollisionSuffix(providerAccountId: string, length = 6): string {
  if (!Number.isInteger(length) || length < 6 || length > 12) {
    throw new Error("Username collision suffix length must be between 6 and 12.");
  }
  return createHash("sha256").update(providerAccountId).digest("hex").slice(0, length);
}
