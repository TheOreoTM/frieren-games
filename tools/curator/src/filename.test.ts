import { describe, expect, it } from "vitest";

import { parseEpisodeFilename } from "./filename";

describe("parseEpisodeFilename", () => {
  it.each([
    ["S01E01.mkv", { season: 1, episode: 1 }],
    ["s1e1.mp4", { season: 1, episode: 1 }],
    ["Frieren - S01E14 - Privilege.mkv", { season: 1, episode: 14 }],
    ["season/S02E10 [1080p].webm", { season: 2, episode: 10 }],
    ["Show.S2-E003.multi.mkv", { season: 2, episode: 3 }],
  ])("parses %s", (filename, expected) => {
    expect(parseEpisodeFilename(filename)).toEqual(expected);
  });

  it.each([
    "Frieren episode 01.mkv",
    "S00E01.mkv",
    "S01E00.mkv",
    "notes-S1E1draft.mkv",
    "not-a-video.txt",
  ])("does not silently guess %s", (filename) => {
    expect(parseEpisodeFilename(filename)).toBeNull();
  });
});
