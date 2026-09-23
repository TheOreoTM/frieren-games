import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { PrismaClient } from "../../src/generated/prisma/client";
import { readManifest, writeManifest } from "../curator/src/manifest";
import { isPathInsideRoot } from "../curator/src/paths";
import { frameInputFromManifest } from "./frame-input";
import { putFrameObject, validateR2Environment } from "./r2-storage";
import { inspectWebp } from "./webp";

if (existsSync(".env.local")) loadEnvFile(".env.local");

const curatorRoot = fileURLToPath(new URL("../curator/", import.meta.url));
const outputDirectory = path.join(curatorRoot, "output");
const manifestPath = path.join(curatorRoot, "manifest.json");

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".") || "configuration"}: ${issue.message}`)
      .join("; ");
  }
  return error instanceof Error ? error.message : String(error);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  validateR2Environment();

  const manifest = await readManifest(manifestPath);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const summary = { pushed: 0, skipped: 0, failed: 0 };

  try {
    for (let index = 0; index < manifest.frames.length; index += 1) {
      const record = manifest.frames[index];
      if (record.status === "PUSHED") {
        summary.skipped += 1;
        continue;
      }

      try {
        const imagePath = path.resolve(curatorRoot, record.outputFile);
        if (!isPathInsideRoot(outputDirectory, imagePath)) {
          throw new Error("Output path escapes tools/curator/output.");
        }
        const imageStats = await lstat(imagePath);
        if (!imageStats.isFile() || imageStats.isSymbolicLink()) {
          throw new Error("Output is not a regular image file.");
        }

        const bytes = await readFile(imagePath);
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        if (sha256 !== record.sha256) throw new Error("WebP checksum differs from the approved manifest.");

        const image = inspectWebp(bytes);
        if (image.width !== record.width || image.height !== record.height) {
          throw new Error(
            `WebP dimensions ${image.width}×${image.height} do not match manifest ${record.width}×${record.height}.`,
          );
        }

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
          throw new Error(`Episode S${record.season}E${record.episode} is missing from the database.`);
        }

        const input = frameInputFromManifest(record, episode.id);
        const existing = await prisma.frame.findUnique({ where: { id: input.id } });
        if (
          existing &&
          (existing.episodeId !== input.episodeId ||
            existing.timestampMs !== input.timestampMs ||
            existing.objectKey !== input.objectKey ||
            existing.width !== input.width ||
            existing.height !== input.height)
        ) {
          throw new Error("An existing Frame with this ID has conflicting immutable metadata.");
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
        await writeManifest(manifestPath, manifest);
        summary.pushed += 1;
        console.log(`Pushed ${record.localId}.`);
      } catch (error) {
        manifest.frames[index] = {
          ...record,
          status: "FAILED",
          lastError: errorMessage(error),
        };
        await writeManifest(manifestPath, manifest);
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
