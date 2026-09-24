import { describe, expect, it } from "vitest";

import { assignSharedRanks } from "./leaderboard";

describe("assignSharedRanks", () => {
  it("gives equal scores a shared competition rank without using speed", () => {
    const ranked = assignSharedRanks([
      { name: "Fern", totalScore: 20_000 },
      { name: "Stark", totalScore: 25_000 },
      { name: "Frieren", totalScore: 20_000 },
      { name: "Himmel", totalScore: 18_000 },
    ]);

    expect(ranked.map(({ name, rank }) => [name, rank])).toEqual([
      ["Stark", 1],
      ["Fern", 2],
      ["Frieren", 2],
      ["Himmel", 4],
    ]);
  });
});
