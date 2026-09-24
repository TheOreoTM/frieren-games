import { describe, expect, it } from "vitest";

import { combineGuessStats } from "./stats";

describe("Guessr stats", () => {
  it("combines modes with a guess-weighted average distance", () => {
    const stats = combineGuessStats(
      { gamesPlayed: 2, guesses: 10, exactGuesses: 3, totalDistance: 20 },
      { gamesPlayed: 1, guesses: 5, exactGuesses: 1, totalDistance: 10 },
    );
    expect(stats).toEqual({
      gamesPlayed: 3,
      guesses: 15,
      exactGuesses: 4,
      totalDistance: 30,
      averageDistance: 2,
    });
  });

  it("uses zero rather than NaN for a new profile", () => {
    expect(combineGuessStats().averageDistance).toBe(0);
  });
});
