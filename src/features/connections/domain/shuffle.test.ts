import { describe, expect, it } from "vitest";

import { deterministicShuffle } from "./shuffle";

describe("deterministicShuffle", () => {
  it("returns the same order for the same seed", () => {
    const tiles = Array.from({ length: 16 }, (_, index) => index + 1);

    expect(deterministicShuffle(tiles, "attempt-1")).toEqual(
      deterministicShuffle(tiles, "attempt-1"),
    );
  });

  it("can produce a different order for a different seed", () => {
    const tiles = Array.from({ length: 16 }, (_, index) => index + 1);

    expect(deterministicShuffle(tiles, "attempt-1")).not.toEqual(
      deterministicShuffle(tiles, "attempt-2"),
    );
  });

  it("returns a permutation without mutating the input", () => {
    const tiles = ["a", "b", "c", "d"];

    const shuffled = deterministicShuffle(tiles, "seed");

    expect(tiles).toEqual(["a", "b", "c", "d"]);
    expect([...shuffled].sort()).toEqual(tiles);
  });
});
