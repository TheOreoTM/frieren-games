import { describe, expect, it } from "vitest";

import { earnedAchievementIds, newAchievementIds } from "./achievements";

describe("achievement evaluation", () => {
  it("returns each earned achievement only once", () => {
    const earned = earnedAchievementIds({
      gamesPlayed: 12,
      rankedDailiesCompleted: 10,
      exactGuesses: 8,
      dailyStreak: 10,
      hasPerfectGame: true,
    });

    expect(earned).toHaveLength(7);
    expect(new Set(earned).size).toBe(earned.length);
  });

  it("does not grant achievements before their thresholds", () => {
    expect(
      earnedAchievementIds({
        gamesPlayed: 0,
        rankedDailiesCompleted: 0,
        exactGuesses: 0,
        dailyStreak: 0,
        hasPerfectGame: false,
      }),
    ).toEqual([]);
  });

  it("does not grant an already unlocked achievement again", () => {
    const progress = {
      gamesPlayed: 1,
      rankedDailiesCompleted: 0,
      exactGuesses: 1,
      dailyStreak: 0,
      hasPerfectGame: false,
    };

    expect(newAchievementIds(progress, new Set(["FIRST_STEPS"]))).toEqual([
      "BULLSEYE",
    ]);
    expect(
      newAchievementIds(progress, new Set(["FIRST_STEPS", "BULLSEYE"])),
    ).toEqual([]);
  });
});
