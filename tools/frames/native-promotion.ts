import { spawnSync } from "node:child_process";

import type { EpisodeSeedRecord } from "../../prisma/episode-seed-data";
import { objectKeyForLocalId } from "./frame-input";
import type { ManifestFrame } from "./manifest-schema";

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function frameValues(records: readonly ManifestFrame[]): string {
  return records
    .map(
      (record) =>
        `(${sqlString(record.localId)}, ${record.season}, ${record.episode}, ${record.timestampMs}, ${sqlString(record.difficulty)}, ${sqlString(objectKeyForLocalId(record.localId))}, ${record.width}, ${record.height})`,
    )
    .join(",\n    ");
}

function episodeValues(episodes: readonly EpisodeSeedRecord[]): string {
  return episodes
    .map(
      (episode) =>
        `(${episode.season}, ${episode.episodeNumber}, ${episode.globalOrder}, ${sqlString(episode.title)})`,
    )
    .join(",\n    ");
}

function conflictCheck(records: readonly ManifestFrame[]): string {
  if (records.length === 0) return "";

  return `
DO $promotion$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (VALUES
      ${frameValues(records)}
    ) AS incoming(id, season, episode_number, timestamp_ms, difficulty, object_key, width, height)
    JOIN "Frame" AS frame
      ON frame."id" = incoming.id
      OR frame."objectKey" = incoming.object_key
    JOIN "Episode" AS episode ON episode."id" = frame."episodeId"
    WHERE frame."id" <> incoming.id
      OR frame."objectKey" <> incoming.object_key
      OR episode."season" <> incoming.season
      OR episode."episodeNumber" <> incoming.episode_number
      OR frame."timestampMs" <> incoming.timestamp_ms
      OR frame."width" <> incoming.width
      OR frame."height" <> incoming.height
  ) THEN
    RAISE EXCEPTION 'Production Frame inventory contains conflicting immutable metadata.';
  END IF;
END
$promotion$;`;
}

export function buildPromotionPreflightSql(
  records: readonly ManifestFrame[],
): string {
  return `BEGIN;${conflictCheck(records)}
ROLLBACK;`;
}

export function buildPromotionApplySql(
  episodes: readonly EpisodeSeedRecord[],
  records: readonly ManifestFrame[],
): string {
  const insertFrames =
    records.length === 0
      ? ""
      : `
INSERT INTO "Frame" (
  "id", "episodeId", "timestampMs", "difficulty", "objectKey", "width", "height", "updatedAt"
)
SELECT
  incoming.id,
  episode."id",
  incoming.timestamp_ms,
  incoming.difficulty::"FrameDifficulty",
  incoming.object_key,
  incoming.width,
  incoming.height,
  CURRENT_TIMESTAMP
FROM (VALUES
  ${frameValues(records)}
) AS incoming(id, season, episode_number, timestamp_ms, difficulty, object_key, width, height)
JOIN "Episode" AS episode
  ON episode."season" = incoming.season
  AND episode."episodeNumber" = incoming.episode_number
ON CONFLICT ("id") DO UPDATE SET
  "difficulty" = EXCLUDED."difficulty",
  "updatedAt" = CURRENT_TIMESTAMP;`;

  return `BEGIN;${conflictCheck(records)}
INSERT INTO "Episode" ("season", "episodeNumber", "globalOrder", "title")
VALUES
  ${episodeValues(episodes)}
ON CONFLICT ("season", "episodeNumber") DO UPDATE SET
  "globalOrder" = EXCLUDED."globalOrder",
  "title" = EXCLUDED."title";
${insertFrames}
COMMIT;`;
}

export function executeNativePromotionSql(
  databaseUrl: string,
  sql: string,
): void {
  const result = spawnSync(
    "npx",
    ["--no-install", "prisma", "db", "execute", "--stdin"],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      input: sql,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        "Prisma native database execution failed.",
    );
  }
}
