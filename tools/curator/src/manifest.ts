import { readFile, rename, writeFile } from "node:fs/promises";

import {
  curatorManifestSchema,
  formatManifestError,
} from "../../frames/manifest-schema";
import type { CuratorManifest, ManifestRecord } from "./types";

export async function readManifest(
  manifestPath: string,
): Promise<CuratorManifest> {
  try {
    const parsed = curatorManifestSchema.safeParse(
      JSON.parse(await readFile(manifestPath, "utf8")),
    );

    if (!parsed.success) {
      throw new Error(
        `Invalid curator manifest:\n${formatManifestError(parsed.error)}`,
      );
    }

    return parsed.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, frames: [] };
    }

    throw error;
  }
}

export async function appendManifestRecord(
  manifestPath: string,
  record: ManifestRecord,
): Promise<CuratorManifest> {
  const manifest = await readManifest(manifestPath);

  if (manifest.frames.some((frame) => frame.localId === record.localId)) {
    throw new Error(`Manifest already contains frame ${record.localId}.`);
  }

  const nextManifest: CuratorManifest = {
    version: 1,
    frames: [...manifest.frames, record],
  };
  await writeManifest(manifestPath, nextManifest);

  return nextManifest;
}

export async function writeManifest(
  manifestPath: string,
  manifest: CuratorManifest,
): Promise<void> {
  const validated = curatorManifestSchema.safeParse(manifest);
  if (!validated.success) {
    throw new Error(
      `Refusing to write an invalid curator manifest:\n${formatManifestError(validated.error)}`,
    );
  }

  const temporaryPath = `${manifestPath}.tmp`;
  await writeFile(
    temporaryPath,
    `${JSON.stringify(validated.data, null, 2)}\n`,
  );
  await rename(temporaryPath, manifestPath);
}
