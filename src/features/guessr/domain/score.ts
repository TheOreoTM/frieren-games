export const MAX_ROUND_SCORE = 5_000;
export const STANDARD_ROUND_COUNT = 5;
export const MAX_STANDARD_SCORE = MAX_ROUND_SCORE * STANDARD_ROUND_COUNT;

export function scoreEpisodeDistance(distance: number): number {
  if (!Number.isInteger(distance) || distance < 0) {
    throw new Error("Episode distance must be a non-negative integer.");
  }
  if (distance === 0) return MAX_ROUND_SCORE;

  return Math.round(
    MAX_ROUND_SCORE * Math.exp(-0.12 * Math.pow(distance, 1.25)),
  );
}
