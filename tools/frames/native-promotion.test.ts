import { describe, expect, it } from "vitest";

import type { EpisodeSeedRecord } from "../../prisma/episode-seed-data";
import type { ManifestFrame } from "./manifest-schema";
import {
  buildPromotionApplySql,
  buildPromotionPreflightSql,
} from "./native-promotion";

const localId = "0123456789abcdef0123456789abcdef";
const frame: ManifestFrame = {
  localId,
  season: 1,
  episode: 1,
  timestampMs: 12_345,
  difficulty: "EASY",
  sourceFile: "private/Frieren S01E01.mkv",
  outputFile: `output/${localId}.webp`,
  width: 1280,
  height: 720,
  sha256: "a".repeat(64),
  status: "LOCAL_APPROVED",
  createdAt: "2026-09-25T10:00:00.000Z",
};
const episode: EpisodeSeedRecord = {
  season: 1,
  episodeNumber: 1,
  globalOrder: 1,
  title: "The Journey's End",
};

describe("native frame promotion SQL", () => {
  it("builds a read-only conflict preflight", () => {
    const sql = buildPromotionPreflightSql([frame]);

    expect(sql).toContain("BEGIN;");
    expect(sql).toContain("ROLLBACK;");
    expect(sql).toContain("conflicting immutable metadata");
    expect(sql).not.toContain(frame.sourceFile);
  });

  it("builds one transactional idempotent synchronization", () => {
    const sql = buildPromotionApplySql([episode], [frame]);

    expect(sql).toContain('INSERT INTO "Episode"');
    expect(sql).toContain('INSERT INTO "Frame"');
    expect(sql).toContain('ON CONFLICT ("id") DO UPDATE');
    expect(sql).toContain("COMMIT;");
    expect(sql).not.toContain(frame.sourceFile);
  });

  it("escapes authored episode titles", () => {
    expect(buildPromotionApplySql([episode], [])).toContain(
      "'The Journey''s End'",
    );
  });
});
