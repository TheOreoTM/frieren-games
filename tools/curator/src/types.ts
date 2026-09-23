import type {
  CuratorManifest,
  ManifestFrame,
} from "../../frames/manifest-schema";

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export type EpisodeNumber = {
  season: number;
  episode: number;
};

export type MediaProbe = {
  durationMs: number;
  width: number;
  height: number;
  videoCodec: string;
  formatName: string;
};

export type DiscoveredEpisode = {
  id: string;
  absolutePath: string;
  relativePath: string;
  filename: string;
  episode: EpisodeNumber | null;
  probe: MediaProbe;
  playback: "source" | "proxy";
};

export type ManifestRecord = ManifestFrame;
export type { CuratorManifest };
