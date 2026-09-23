import { describe, expect, it } from "vitest";

import { frameInputFromManifest, objectKeyForLocalId } from "./frame-input";
import type { ManifestFrame } from "./manifest-schema";

const localId = "0123456789abcdef0123456789abcdef";

describe("opaque frame identity", () => {
  it("creates a stable answer-free object key", () => {
    const key = objectKeyForLocalId(localId);
    expect(key).toBe(`frames/${localId}.webp`);
    expect(key).not.toMatch(/s\d+e\d+|season|episode|\d+m\d+s/i);
  });

  it("maps a manifest record to the idempotent database input", () => {
    const record: ManifestFrame = {
      localId,
      season: 1,
      episode: 12,
      timestampMs: 98_765,
      difficulty: "HARD",
      sourceFile: "private/S01E12.mkv",
      outputFile: `output/${localId}.webp`,
      width: 1280,
      height: 720,
      sha256: "c".repeat(64),
      status: "LOCAL_APPROVED",
      createdAt: "2026-09-23T10:00:00.000Z",
    };

    expect(frameInputFromManifest(record, 42)).toEqual({
      id: localId,
      episodeId: 42,
      timestampMs: 98_765,
      difficulty: "HARD",
      objectKey: `frames/${localId}.webp`,
      width: 1280,
      height: 720,
    });
  });
});
