import { describe, expect, it } from "vitest";

import { onboardingSchema } from "./onboarding";

describe("onboardingSchema", () => {
  it("normalizes a submitted username and trims the display name", () => {
    expect(
      onboardingSchema.parse({ username: "FERN", displayName: "  Fern  " }),
    ).toEqual({ username: "fern", displayName: "Fern" });
  });

  it("rejects an empty or oversized display name", () => {
    expect(
      onboardingSchema.safeParse({ username: "fern", displayName: "   " })
        .success,
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({
        username: "fern",
        displayName: "x".repeat(41),
      }).success,
    ).toBe(false);
  });

  it("does not silently turn invalid punctuation into a generated username", () => {
    expect(
      onboardingSchema.safeParse({ username: "---", displayName: "Fern" })
        .success,
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({ username: "two words", displayName: "Fern" })
        .success,
    ).toBe(false);
  });
});
