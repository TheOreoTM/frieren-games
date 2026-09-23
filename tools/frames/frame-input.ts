import type { ManifestFrame } from "./manifest-schema";

export function objectKeyForLocalId(localId: string): string {
  if (!/^[a-f0-9]{32}$/.test(localId)) {
    throw new Error("Cannot create an object key from an invalid local ID.");
  }

  return `frames/${localId}.webp`;
}

export function frameInputFromManifest(record: ManifestFrame, episodeId: number) {
  return {
    id: record.localId,
    episodeId,
    timestampMs: record.timestampMs,
    difficulty: record.difficulty,
    objectKey: objectKeyForLocalId(record.localId),
    width: record.width,
    height: record.height,
  };
}
