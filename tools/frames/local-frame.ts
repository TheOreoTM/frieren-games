import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isPathInsideRoot } from "../curator/src/paths";
import type { ManifestFrame } from "./manifest-schema";
import { inspectWebp } from "./webp";

export const curatorRoot = fileURLToPath(
  new URL("../curator/", import.meta.url),
);
export const curatorOutputDirectory = path.join(curatorRoot, "output");
export const curatorManifestPath = path.join(curatorRoot, "manifest.json");

export async function readVerifiedFrameBytes(
  record: ManifestFrame,
): Promise<Uint8Array> {
  const imagePath = path.resolve(curatorRoot, record.outputFile);
  if (!isPathInsideRoot(curatorOutputDirectory, imagePath)) {
    throw new Error("Output path escapes tools/curator/output.");
  }

  const imageStats = await lstat(imagePath);
  if (!imageStats.isFile() || imageStats.isSymbolicLink()) {
    throw new Error("Output is not a regular image file.");
  }

  const bytes = await readFile(imagePath);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== record.sha256) {
    throw new Error("WebP checksum differs from the approved manifest.");
  }

  const image = inspectWebp(bytes);
  if (image.width !== record.width || image.height !== record.height) {
    throw new Error(
      `WebP dimensions ${image.width}×${image.height} do not match manifest ${record.width}×${record.height}.`,
    );
  }

  return bytes;
}
