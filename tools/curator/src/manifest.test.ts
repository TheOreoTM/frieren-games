import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { appendManifestRecord, readManifest } from "./manifest";
import type { ManifestRecord } from "./types";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true })),
  );
});

describe("curator manifest", () => {
  it("starts empty and durably appends an approval", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "frieren-curator-"));
    temporaryDirectories.push(directory);
    const manifestPath = path.join(directory, "manifest.json");
    const record: ManifestRecord = {
      localId: "0123456789abcdef0123456789abcdef",
      season: 1,
      episode: 3,
      timestampMs: 42_125,
      difficulty: "MEDIUM",
      sourceFile: "S01E03.mkv",
      outputFile: "output/0123456789abcdef0123456789abcdef.webp",
      width: 1280,
      height: 720,
      sha256: "a".repeat(64),
      status: "LOCAL_APPROVED",
      createdAt: "2026-09-21T00:00:00.000Z",
    };

    expect(await readManifest(manifestPath)).toEqual({
      version: 1,
      frames: [],
    });
    await appendManifestRecord(manifestPath, record);

    expect(await readManifest(manifestPath)).toEqual({
      version: 1,
      frames: [record],
    });
    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toEqual({
      version: 1,
      frames: [record],
    });
  });

  it("rejects a duplicate opaque ID", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "frieren-curator-"));
    temporaryDirectories.push(directory);
    const manifestPath = path.join(directory, "manifest.json");
    const record: ManifestRecord = {
      localId: "abcdef0123456789abcdef0123456789",
      season: 1,
      episode: 1,
      timestampMs: 1_000,
      difficulty: "EASY",
      sourceFile: "S01E01.mkv",
      outputFile: "output/abcdef0123456789abcdef0123456789.webp",
      width: 1280,
      height: 720,
      sha256: "b".repeat(64),
      status: "LOCAL_APPROVED",
      createdAt: "2026-09-21T00:00:00.000Z",
    };

    await appendManifestRecord(manifestPath, record);
    await expect(appendManifestRecord(manifestPath, record)).rejects.toThrow(
      "already contains",
    );
  });
});
