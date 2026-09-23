import path from "node:path";

import type { EpisodeNumber } from "./types";

const EPISODE_TOKEN = /(?:^|[^a-z0-9])s(\d{1,2})[\s._-]*e(\d{1,3})(?=$|[^a-z0-9])/i;

export function parseEpisodeFilename(filename: string): EpisodeNumber | null {
  const basename = path.basename(filename, path.extname(filename));
  const match = EPISODE_TOKEN.exec(basename);

  if (!match) return null;

  const season = Number.parseInt(match[1], 10);
  const episode = Number.parseInt(match[2], 10);

  if (season < 1 || episode < 1) return null;

  return { season, episode };
}
