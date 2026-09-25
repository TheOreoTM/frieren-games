import { describe, expect, it } from "vitest";

import { scoreEpisodeDistance } from "./score";

describe("scoreEpisodeDistance", () => {
  it.each([
    [0, 5000],
    [1, 4435],
    [2, 3759],
    [3, 3113],
    [4, 2536],
    [5, 2039],
    [8, 995],
    [10, 592],
    [15, 145],
    [20, 31],
  ])("scores distance %i as %i", (distance, expected) => {
    expect(scoreEpisodeDistance(distance)).toBe(expected);
  });

  it("rejects invalid distances", () => {
    expect(() => scoreEpisodeDistance(-1)).toThrow();
    expect(() => scoreEpisodeDistance(1.5)).toThrow();
  });
});
