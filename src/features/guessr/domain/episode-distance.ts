export function episodeDistance(
  actualGlobalOrder: number,
  guessedGlobalOrder: number,
) {
  if (
    !Number.isInteger(actualGlobalOrder) ||
    !Number.isInteger(guessedGlobalOrder) ||
    actualGlobalOrder < 1 ||
    guessedGlobalOrder < 1
  ) {
    throw new Error("Episode global order must be a positive integer.");
  }

  return Math.abs(actualGlobalOrder - guessedGlobalOrder);
}
