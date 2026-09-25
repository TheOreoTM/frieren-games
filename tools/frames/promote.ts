import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { episodeSeedData } from "../../prisma/episode-seed-data";
import { PrismaClient } from "../../src/generated/prisma/client";
import { readManifest } from "../curator/src/manifest";
import { frameInputFromManifest, objectKeyForLocalId } from "./frame-input";
import { curatorManifestPath, readVerifiedFrameBytes } from "./local-frame";
import type { ManifestFrame } from "./manifest-schema";
import { planFramePromotion } from "./promotion-plan";
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
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: options.databaseUrl }),
  });

  try {
    const ids = manifest.frames.map((record) => record.localId);
    const objectKeys = manifest.frames.map((record) =>
      objectKeyForLocalId(record.localId),
    );
    const existingFrames =
      ids.length === 0
        ? []
        : await prisma.frame.findMany({
            where: {
              OR: [{ id: { in: ids } }, { objectKey: { in: objectKeys } }],
            },
            include: {
              episode: { select: { season: true, episodeNumber: true } },
            },
          });
    const plan = planFramePromotion(manifest.frames, existingFrames);

    console.log(
      `Plan: ${plan.creates} create, ${plan.difficultyUpdates} difficulty update, ${plan.unchanged} unchanged.`,
    );

    if (!options.apply) {
      console.log(
        `Dry run complete. Re-run with --apply --confirm=${options.targetLabel} to write this plan.`,
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

    await prisma.$transaction(
      async (database) => {
        for (const episode of episodeSeedData) {
          await database.episode.upsert({
            where: {
              season_episodeNumber: {
                season: episode.season,
                episodeNumber: episode.episodeNumber,
              },
            },
            create: episode,
            update: {
              globalOrder: episode.globalOrder,
              title: episode.title,
            },
          });
        }

        const episodes = await database.episode.findMany({
          where: {
            OR: episodeSeedData.map((episode) => ({
              season: episode.season,
              episodeNumber: episode.episodeNumber,
            })),
          },
          select: { id: true, season: true, episodeNumber: true },
        });
        const episodeIds = new Map(
          episodes.map((episode) => [
            episodeKey(episode.season, episode.episodeNumber),
            episode.id,
          ]),
        );

        for (const { record } of verifiedFrames) {
          const episodeId = episodeIds.get(
            episodeKey(record.season, record.episode),
          );
          if (!episodeId) {
            throw new Error(
              `Production episode S${record.season}E${record.episode} was not synchronized.`,
            );
          }
          const input = frameInputFromManifest(record, episodeId);
          await database.frame.upsert({
            where: { id: input.id },
            create: input,
            update: { difficulty: input.difficulty },
          });
        }
      },
      { isolationLevel: "Serializable" },
    );

    console.log(
      `Production promotion complete: ${verifiedFrames.length} object(s) verified in R2 and ${verifiedFrames.length} Frame record(s) synchronized.`,
    );
    console.log("The local curator manifest was not modified.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`Production promotion aborted: ${errorMessage(error)}`);
  process.exitCode = 1;
});
