import { describe, expect, it } from "vitest";

import { selectDailyFrames, type DailyFrameCandidate } from "./daily-generator";

function inventory(): DailyFrameCandidate[] {
  return [
    { id: "easy-1", episodeId: 1, difficulty: "EASY" },
    { id: "easy-2", episodeId: 2, difficulty: "EASY" },
    { id: "medium-1", episodeId: 3, difficulty: "MEDIUM" },
    { id: "medium-2", episodeId: 4, difficulty: "MEDIUM" },
    { id: "medium-3", episodeId: 5, difficulty: "MEDIUM" },
    { id: "medium-4", episodeId: 6, difficulty: "MEDIUM" },
    { id: "hard-1", episodeId: 7, difficulty: "HARD" },
    { id: "hard-2", episodeId: 8, difficulty: "HARD" },
  ];
}

describe("selectDailyFrames", () => {
  it("returns five distinct frames and episodes with the target composition", () => {
    const selected = selectDailyFrames(inventory(), { random: () => 0.42 });

    expect(selected).toHaveLength(5);
    expect(new Set(selected.map((frame) => frame.id))).toHaveLength(5);
    expect(new Set(selected.map((frame) => frame.episodeId))).toHaveLength(5);
    expect(selected.map((frame) => frame.difficulty).sort()).toEqual([
      "EASY",
      "HARD",
      "MEDIUM",
      "MEDIUM",
      "MEDIUM",
    ]);
  });

  it("never selects a frame already used by a ranked Daily", () => {
    const selected = selectDailyFrames(inventory(), {
      usedFrameIds: new Set(["easy-1", "medium-1", "hard-1"]),
      random: () => 0.2,
    });

    expect(selected.map((frame) => frame.id)).not.toContain("easy-1");
    expect(selected.map((frame) => frame.id)).not.toContain("medium-1");
    expect(selected.map((frame) => frame.id)).not.toContain("hard-1");
  });

  it("prefers episodes outside the recent window", () => {
    const selected = selectDailyFrames(inventory(), {
      recentEpisodeIds: new Set([1, 3, 4, 7]),
      random: () => 0.3,
    });

    const selectedEpisodes = selected.map((frame) => frame.episodeId);
    expect(selectedEpisodes).toEqual(expect.arrayContaining([2, 5, 6, 8]));
    expect(selectedEpisodes.filter((episodeId) => [1, 3, 4, 7].includes(episodeId))).toHaveLength(1);
  });

  it("falls back across difficulties but still requires five episodes", () => {
    const allEasy = Array.from({ length: 5 }, (_, index) => ({
      id: `frame-${index}`,
      episodeId: index + 1,
      difficulty: "EASY" as const,
    }));
    expect(selectDailyFrames(allEasy, { random: () => 0.1 })).toHaveLength(5);
    expect(() => selectDailyFrames(allEasy.slice(0, 4))).toThrow("at least 5 episodes");
  });
});
