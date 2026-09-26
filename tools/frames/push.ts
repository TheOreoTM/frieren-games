import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { PrismaClient } from "../../src/generated/prisma/client";
import { readManifest, writeManifest } from "../curator/src/manifest";
import { frameInputFromManifest } from "./frame-input";
import { curatorManifestPath, readVerifiedFrameBytes } from "./local-frame";
import { parseFramePushOptions } from "./push-options";
import { putFrameObject, validateR2Environment } from "./r2-storage";

if (existsSync(".env.local")) loadEnvFile(".env.local");

function errorMessage(error: unknown) {
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

async function main() {
  const options = parseFramePushOptions(process.argv.slice(2));
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  validateR2Environment();

  const manifest = await readManifest(curatorManifestPath);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const summary = { pushed: 0, skipped: 0, failed: 0 };

  try {
    for (let index = 0; index < manifest.frames.length; index += 1) {
      const record = manifest.frames[index];
      if (record.status === "PUSHED" && !options.includePushed) {
        summary.skipped += 1;
        continue;
      }

      try {
        const bytes = await readVerifiedFrameBytes(record);

        const episode = await prisma.episode.findUnique({
          where: {
            season_episodeNumber: {
              season: record.season,
              episodeNumber: record.episode,
            },
          },
          select: { id: true },
        });
        if (!episode) {
          throw new Error(
            `Episode S${record.season}E${record.episode} is missing from the database.`,
          );
        }

        const input = frameInputFromManifest(record, episode.id);
        const existing = await prisma.frame.findUnique({
          where: { id: input.id },
        });
        if (
          existing &&
          (existing.episodeId !== input.episodeId ||
            existing.timestampMs !== input.timestampMs ||
            existing.objectKey !== input.objectKey ||
            existing.width !== input.width ||
            existing.height !== input.height)
        ) {
          throw new Error(
            "An existing Frame with this ID has conflicting immutable metadata.",
          );
        }

        await putFrameObject(input.objectKey, bytes);
        await prisma.frame.upsert({
          where: { id: input.id },
          create: input,
          update: { difficulty: input.difficulty },
        });

        manifest.frames[index] = {
          ...record,
          status: "PUSHED",
          objectKey: input.objectKey,
          pushedAt: new Date().toISOString(),
          lastError: undefined,
        };
        await writeManifest(curatorManifestPath, manifest);
        summary.pushed += 1;
        console.log(`Pushed ${record.localId}.`);
      } catch (error) {
        manifest.frames[index] = {
          ...record,
          status: "FAILED",
          lastError: errorMessage(error),
        };
        await writeManifest(curatorManifestPath, manifest);
        summary.failed += 1;
        console.error(`Failed ${record.localId}: ${errorMessage(error)}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(
    `Frame push complete: ${summary.pushed} pushed, ${summary.skipped} skipped, ${summary.failed} failed.`,
  );
  if (summary.failed > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`Frame push aborted: ${errorMessage(error)}`);
  process.exitCode = 1;
});
