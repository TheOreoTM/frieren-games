import { describe, expect, it } from "vitest";

import { episodeDistance } from "./episode-distance";

describe("episodeDistance", () => {
  it("treats S1E28 and S2E01 as adjacent in global order", () => {
    expect(episodeDistance(28, 29)).toBe(1);
  });

  it("is direction-independent", () => {
    expect(episodeDistance(35, 4)).toBe(31);
    expect(episodeDistance(4, 35)).toBe(31);
  });
});
