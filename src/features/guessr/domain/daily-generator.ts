import type { FrameDifficulty } from "@/generated/prisma/client";

export type DailyFrameCandidate = {
  id: string;
  episodeId: number;
  difficulty: FrameDifficulty;
};

const targetDifficulties: FrameDifficulty[] = [
  "EASY",
  "MEDIUM",
  "MEDIUM",
  "MEDIUM",
  "HARD",
];

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function preferFreshEpisodes(
  candidates: DailyFrameCandidate[],
  recentEpisodeIds: ReadonlySet<number>,
) {
  return candidates.sort(
    (left, right) =>
      Number(recentEpisodeIds.has(left.episodeId)) -
      Number(recentEpisodeIds.has(right.episodeId)),
  );
}

function exactComposition(
  candidates: DailyFrameCandidate[],
  recentEpisodeIds: ReadonlySet<number>,
): DailyFrameCandidate[] | null {
  const selected: DailyFrameCandidate[] = [];
  const episodeIds = new Set<number>();

  function visit(slot: number): boolean {
    if (slot === targetDifficulties.length) return true;
    const difficulty = targetDifficulties[slot];
    const options = preferFreshEpisodes(
      candidates.filter(
        (candidate) =>
          candidate.difficulty === difficulty && !episodeIds.has(candidate.episodeId),
      ),
      recentEpisodeIds,
    );

    for (const candidate of options) {
      selected.push(candidate);
      episodeIds.add(candidate.episodeId);
      if (visit(slot + 1)) return true;
      selected.pop();
      episodeIds.delete(candidate.episodeId);
    }
    return false;
  }

  return visit(0) ? selected : null;
}

export function selectDailyFrames(
  inventory: DailyFrameCandidate[],
  options: {
    usedFrameIds?: ReadonlySet<string>;
    recentEpisodeIds?: ReadonlySet<number>;
    random?: () => number;
  } = {},
): DailyFrameCandidate[] {
  const usedFrameIds = options.usedFrameIds ?? new Set<string>();
  const recentEpisodeIds = options.recentEpisodeIds ?? new Set<number>();
  const random = options.random ?? Math.random;
  const candidates = shuffled(
    inventory.filter((candidate) => !usedFrameIds.has(candidate.id)),
    random,
  );

  const exact = exactComposition(candidates, recentEpisodeIds);
  if (exact) return exact;

  const fallback: DailyFrameCandidate[] = [];
  const selectedEpisodes = new Set<number>();
  for (const candidate of preferFreshEpisodes(candidates, recentEpisodeIds)) {
    if (selectedEpisodes.has(candidate.episodeId)) continue;
    fallback.push(candidate);
    selectedEpisodes.add(candidate.episodeId);
    if (fallback.length === 5) return fallback;
  }

  throw new Error("Daily generation requires enabled unused frames from at least 5 episodes.");
}
