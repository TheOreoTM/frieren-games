import { describe, expect, it } from "vitest";

import { calculateDailyStreak } from "./daily-streak";

describe("calculateDailyStreak", () => {
  const challenges = ["day-1", "day-2", "day-3", "day-4"];

  it("counts consecutive completed challenge IDs regardless of score", () => {
    expect(
      calculateDailyStreak(
        challenges,
        new Set(["day-2", "day-3", "day-4"]),
        "day-4",
      ),
    ).toBe(3);
  });

  it("preserves yesterday's streak while today's Daily is unfinished", () => {
    expect(
      calculateDailyStreak(
        challenges,
        new Set(["day-1", "day-2", "day-3"]),
        "day-4",
      ),
    ).toBe(3);
  });

  it("stops at the first missed non-void challenge", () => {
    expect(
      calculateDailyStreak(
        challenges,
        new Set(["day-1", "day-3", "day-4"]),
        "day-4",
      ),
    ).toBe(2);
  });
});
