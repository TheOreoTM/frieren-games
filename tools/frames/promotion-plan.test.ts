import { describe, expect, it } from "vitest";

import { objectKeyForLocalId } from "./frame-input";
import type { ManifestFrame } from "./manifest-schema";
import {
  planFramePromotion,
  type ExistingProductionFrame,
} from "./promotion-plan";

const localId = "0123456789abcdef0123456789abcdef";

function manifestFrame(overrides: Partial<ManifestFrame> = {}): ManifestFrame {
  return {
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
    status: "PUSHED",
    objectKey: objectKeyForLocalId(localId),
    pushedAt: "2026-09-23T11:00:00.000Z",
    createdAt: "2026-09-23T10:00:00.000Z",
    ...overrides,
  };
}

function existingFrame(
  overrides: Partial<ExistingProductionFrame> = {},
): ExistingProductionFrame {
  return {
    id: localId,
    episode: { season: 1, episodeNumber: 12 },
    timestampMs: 98_765,
    difficulty: "HARD",
    objectKey: objectKeyForLocalId(localId),
    width: 1280,
    height: 720,
    ...overrides,
  };
}

describe("frame promotion planning", () => {
  it("classifies creates, difficulty updates, and unchanged frames", () => {
    const secondId = "abcdef0123456789abcdef0123456789";
    const thirdId = "fedcba9876543210fedcba9876543210";

    expect(
      planFramePromotion(
        [
          manifestFrame(),
          manifestFrame({
            localId: secondId,
            outputFile: `output/${secondId}.webp`,
            objectKey: objectKeyForLocalId(secondId),
          }),
          manifestFrame({
            localId: thirdId,
            outputFile: `output/${thirdId}.webp`,
            objectKey: objectKeyForLocalId(thirdId),
          }),
        ],
        [
          existingFrame(),
          existingFrame({
            id: secondId,
            objectKey: objectKeyForLocalId(secondId),
            difficulty: "EASY",
          }),
        ],
      ),
    ).toEqual({ creates: 1, difficultyUpdates: 1, unchanged: 1 });
  });

  it("rejects immutable metadata conflicts", () => {
    expect(() =>
      planFramePromotion(
        [manifestFrame()],
        [existingFrame({ timestampMs: 123 })],
      ),
    ).toThrow("conflicting immutable metadata");
  });

  it("rejects an opaque object key owned by another frame", () => {
    expect(() =>
      planFramePromotion(
        [manifestFrame()],
        [existingFrame({ id: "ffffffffffffffffffffffffffffffff" })],
      ),
    ).toThrow("different production Frame");
  });
});
