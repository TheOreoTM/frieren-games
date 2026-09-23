import { describe, expect, it } from "vitest";

import { curatorManifestSchema } from "./manifest-schema";

const validFrame = {
  localId: "0123456789abcdef0123456789abcdef",
  season: 1,
  episode: 4,
  timestampMs: 123_456,
  difficulty: "MEDIUM" as const,
  sourceFile: "S01E04.mkv",
  outputFile: "output/0123456789abcdef0123456789abcdef.webp",
  width: 1280,
  height: 720,
  sha256: "a".repeat(64),
  status: "LOCAL_APPROVED" as const,
  createdAt: "2026-09-23T10:00:00.000Z",
};

describe("curatorManifestSchema", () => {
  it("accepts an existing local approval", () => {
    expect(curatorManifestSchema.parse({ version: 1, frames: [validFrame] })).toEqual({
      version: 1,
      frames: [validFrame],
    });
  });

  it("requires output filenames to match the opaque local ID", () => {
    const result = curatorManifestSchema.safeParse({
      version: 1,
      frames: [{ ...validFrame, outputFile: "output/S01E04-123456.webp" }],
    });
    expect(result.success).toBe(false);
  });

  it("requires pushed records to retain their object key and time", () => {
    const result = curatorManifestSchema.safeParse({
      version: 1,
      frames: [{ ...validFrame, status: "PUSHED" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate local IDs", () => {
    const result = curatorManifestSchema.safeParse({
      version: 1,
      frames: [validFrame, validFrame],
    });
    expect(result.success).toBe(false);
  });
});
