import "server-only";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { publicFrameUrl } from "@/lib/r2";

const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

const frameFilterSchema = z.object({
  season: optionalPositiveInteger,
  episode: optionalPositiveInteger,
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  status: z.enum(["enabled", "disabled"]).optional(),
});

export type AdminFrameFilters = z.infer<typeof frameFilterSchema>;

export function parseAdminFrameFilters(input: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const parsed = frameFilterSchema.safeParse({
    season: first(input.season),
    episode: first(input.episode),
    difficulty: first(input.difficulty) || undefined,
    status: first(input.status) || undefined,
  });

  return parsed.success ? parsed.data : {};
}

export async function listAdminFrames(filters: AdminFrameFilters) {
  const where: Prisma.FrameWhereInput = {
    difficulty: filters.difficulty,
    enabled: filters.status === "enabled" ? true : filters.status === "disabled" ? false : undefined,
    episode:
      filters.season || filters.episode
        ? {
            season: filters.season,
            episodeNumber: filters.episode,
          }
        : undefined,
  };

  const frames = await getDb().frame.findMany({
    where,
    orderBy: [{ episode: { globalOrder: "asc" } }, { timestampMs: "asc" }],
    take: 250,
    select: {
      id: true,
      timestampMs: true,
      difficulty: true,
      enabled: true,
      objectKey: true,
      width: true,
      height: true,
      episode: {
        select: {
          season: true,
          episodeNumber: true,
          title: true,
        },
      },
    },
  });

  return frames.map(({ objectKey, ...frame }) => ({
    ...frame,
    imageUrl: publicFrameUrl(objectKey),
  }));
}

export async function listFrameFilterOptions() {
  return getDb().episode.findMany({
    where: { frames: { some: {} } },
    orderBy: { globalOrder: "asc" },
    select: { season: true, episodeNumber: true, title: true },
  });
}

export async function setFrameDifficulty(id: string, difficulty: "EASY" | "MEDIUM" | "HARD") {
  await getDb().frame.update({ where: { id }, data: { difficulty } });
}

export async function setFrameEnabled(id: string, enabled: boolean) {
  await getDb().frame.update({ where: { id }, data: { enabled } });
}
