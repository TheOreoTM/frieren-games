import { describe, expect, it } from "vitest";

import {
  normalizeUsername,
  suffixedUsername,
  usernameSchema,
} from "./username";
import { usernameCollisionSuffix } from "./username-collision";

describe("profile usernames", () => {
  it.each([
    ["Fern", "fern"],
    ["Frieren The Slayer", "frieren-the-slayer"],
    ["Übel!!", "ubel"],
    ["_Stark_", "stark"],
    ["a", "a-user"],
    ["✨", "traveler"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeUsername(input)).toBe(expected);
  });

  it("accepts only the public URL-safe format", () => {
    expect(usernameSchema.safeParse("fern-123").success).toBe(true);
    expect(usernameSchema.safeParse("stark_warrior").success).toBe(true);
    expect(usernameSchema.safeParse("Fern").success).toBe(false);
    expect(usernameSchema.safeParse("-fern").success).toBe(false);
    expect(usernameSchema.safeParse("two words").success).toBe(false);
  });

  it("creates a stable collision fallback without exposing the provider ID", () => {
    const providerId = "123456789012345678";
    const suffix = usernameCollisionSuffix(providerId);
    const fallback = suffixedUsername("a-very-long-discord-username", suffix);

    expect(suffix).toMatch(/^[a-f0-9]{6}$/);
    expect(suffix).not.toContain(providerId.slice(-6));
    expect(fallback.length).toBeLessThanOrEqual(24);
    expect(usernameSchema.parse(fallback)).toBe(fallback);
  });
});
