import { describe, expect, it } from "vitest";

import { selectUnlimitedFrames } from "./frame-selection";

describe("selectUnlimitedFrames", () => {
  it("selects unique frames from distinct episodes when inventory permits", () => {
    const frames = Array.from({ length: 12 }, (_, index) => ({
      id: `frame-${index}`,
      episodeId: index % 6,
    }));
    const selected = selectUnlimitedFrames(frames, 5, () => 0.42);

    expect(new Set(selected.map((frame) => frame.id)).size).toBe(5);
    expect(new Set(selected.map((frame) => frame.episodeId)).size).toBe(5);
  });

  it("falls back to repeated episodes without repeating exact frames", () => {
    const frames = Array.from({ length: 8 }, (_, index) => ({
      id: `frame-${index}`,
      episodeId: index % 2,
    }));
    const selected = selectUnlimitedFrames(frames, 5, () => 0.1);

    expect(selected).toHaveLength(5);
    expect(new Set(selected.map((frame) => frame.id)).size).toBe(5);
  });

  it("refuses insufficient eligible inventory", () => {
    expect(() =>
      selectUnlimitedFrames([{ id: "only", episodeId: 1 }], 5),
    ).toThrow("at least 5 enabled frames");
  });
});
