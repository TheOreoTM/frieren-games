import { describe, expect, it } from "vitest";

import { episodeSeedData } from "./episode-seed-data";

describe("episodeSeedData", () => {
  it("keeps all TV episodes in one continuous global order", () => {
    expect(episodeSeedData).toHaveLength(38);
    expect(episodeSeedData.map((episode) => episode.globalOrder)).toEqual(
      Array.from({ length: 38 }, (_, index) => index + 1),
    );
    expect(episodeSeedData[27]).toMatchObject({ season: 1, episodeNumber: 28 });
    expect(episodeSeedData[28]).toMatchObject({ season: 2, episodeNumber: 1 });
  });

  it("contains display titles rather than placeholder labels", () => {
    expect(episodeSeedData.every((episode) => !episode.title.startsWith("Season "))).toBe(true);
  });
});
