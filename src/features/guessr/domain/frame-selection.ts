export type EligibleFrame = {
  id: string;
  episodeId: number;
};

function shuffled<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function selectUnlimitedFrames(
  eligibleFrames: EligibleFrame[],
  count: number,
  random: () => number = Math.random,
): EligibleFrame[] {
  if (!Number.isInteger(count) || count < 1)
    throw new Error("Frame count must be positive.");
  if (eligibleFrames.length < count) {
    throw new Error(`Unlimited requires at least ${count} enabled frames.`);
  }

  const candidates = shuffled(eligibleFrames, random);
  const selected: EligibleFrame[] = [];
  const selectedFrameIds = new Set<string>();
  const selectedEpisodeIds = new Set<number>();

  for (const frame of candidates) {
    if (selectedEpisodeIds.has(frame.episodeId)) continue;
    selected.push(frame);
    selectedFrameIds.add(frame.id);
    selectedEpisodeIds.add(frame.episodeId);
    if (selected.length === count) return selected;
  }

  for (const frame of candidates) {
    if (selectedFrameIds.has(frame.id)) continue;
    selected.push(frame);
    selectedFrameIds.add(frame.id);
    if (selected.length === count) return selected;
  }

  throw new Error("Unable to select enough unique frames.");
}
