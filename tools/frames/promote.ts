import { z } from "zod";

import { episodeSeedData } from "../../prisma/episode-seed-data";
import { readManifest } from "../curator/src/manifest";
import { objectKeyForLocalId } from "./frame-input";
import { curatorManifestPath, readVerifiedFrameBytes } from "./local-frame";
import type { ManifestFrame } from "./manifest-schema";
import {
  buildPromotionApplySql,
  buildPromotionPreflightSql,
  executeNativePromotionSql,
} from "./native-promotion";
import { parseProductionPromotionOptions } from "./promotion-policy";
import { createFrameObjectWriter } from "./r2-storage";

type VerifiedFrame = {
  record: ManifestFrame;
  bytes: Uint8Array;
};

function errorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map(
        (issue) =>
          `${issue.path.join(".") || "configuration"}: ${issue.message}`,
      )
      .join("; ");
  }
  return error instanceof Error ? error.message : String(error);
}

function episodeKey(season: number, episode: number): string {
  return `${season}:${episode}`;
}

async function verifyLocalInventory(
  records: readonly ManifestFrame[],
): Promise<VerifiedFrame[]> {
  const verified: VerifiedFrame[] = [];
  for (const record of records) {
    verified.push({
      record,
      bytes: await readVerifiedFrameBytes(record),
    });
  }
  return verified;
}

async function main() {
  const options = parseProductionPromotionOptions(
    process.argv.slice(2),
    process.env,
  );
  const manifest = await readManifest(curatorManifestPath);
  const catalogEpisodes = new Map(
    episodeSeedData.map((episode) => [
      episodeKey(episode.season, episode.episodeNumber),
      episode,
    ]),
  );

  for (const record of manifest.frames) {
    if (!catalogEpisodes.has(episodeKey(record.season, record.episode))) {
      throw new Error(
        `Frame ${record.localId} references S${record.season}E${record.episode}, which is missing from the canonical episode catalogue.`,
      );
    }
  }

  console.log(`Target: ${options.targetLabel}`);
  console.log(`Database: ${options.databaseDisplay}`);
  console.log(`R2 bucket: ${options.r2.R2_BUCKET}`);
  console.log(`Public frame origin: ${options.r2PublicBaseUrl}`);
  console.log(`Mode: ${options.apply ? "APPLY" : "DRY RUN (no writes)"}`);
  console.log(`Verifying ${manifest.frames.length} approved local frame(s)...`);

  const verifiedFrames = await verifyLocalInventory(manifest.frames);
  executeNativePromotionSql(
    options.databaseUrl,
    buildPromotionPreflightSql(manifest.frames),
  );
  console.log(
    `Preflight passed for ${manifest.frames.length} frame record(s); no immutable conflicts found.`,
  );

  if (!options.apply) {
    console.log(
      `Dry run complete. Re-run with --apply --confirm=${options.targetLabel} to synchronize this inventory.`,
    );
    return;
  }

  const putFrameObject = createFrameObjectWriter(options.r2);
  for (const [index, frame] of verifiedFrames.entries()) {
    await putFrameObject(
      objectKeyForLocalId(frame.record.localId),
      frame.bytes,
    );
    console.log(
      `Uploaded ${index + 1}/${verifiedFrames.length}: ${frame.record.localId}`,
    );
  }

  executeNativePromotionSql(
    options.databaseUrl,
    buildPromotionApplySql(episodeSeedData, manifest.frames),
  );

  console.log(
    `Production promotion complete: ${verifiedFrames.length} object(s) verified in R2 and ${verifiedFrames.length} Frame record(s) synchronized.`,
  );
  console.log("The local curator manifest was not modified.");
}

main().catch((error: unknown) => {
  console.error(`Production promotion aborted: ${errorMessage(error)}`);
  process.exitCode = 1;
});
