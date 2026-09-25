import { z } from "zod";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH, "Username must be at least 3 characters.")
  .max(USERNAME_MAX_LENGTH, "Username must be at most 24 characters.")
  .regex(
    /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/,
    "Use lowercase letters, numbers, hyphens, or underscores, and start and end with a letter or number.",
  );

export function normalizeUsername(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, USERNAME_MAX_LENGTH)
    .replace(/[-_]+$/g, "");

  if (normalized.length >= USERNAME_MIN_LENGTH) return normalized;
  if (normalized.length > 0) return `${normalized}-user`;
  return "traveler";
}

export function suffixedUsername(base: string, suffix: string): string {
  const safeSuffix = suffix
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  if (!safeSuffix)
    throw new Error("Username suffix must contain a letter or number.");
  const availableBaseLength = USERNAME_MAX_LENGTH - safeSuffix.length - 1;
  const trimmedBase = base.slice(0, availableBaseLength).replace(/[-_]+$/g, "");
  return `${trimmedBase}-${safeSuffix}`;
}
