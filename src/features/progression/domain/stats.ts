export type GuessAggregate = {
  gamesPlayed: number;
  guesses: number;
  exactGuesses: number;
  totalDistance: number;
};

export function combineGuessStats(...sources: readonly GuessAggregate[]) {
  const totals = sources.reduce<GuessAggregate>(
    (result, source) => ({
      gamesPlayed: result.gamesPlayed + source.gamesPlayed,
      guesses: result.guesses + source.guesses,
      exactGuesses: result.exactGuesses + source.exactGuesses,
      totalDistance: result.totalDistance + source.totalDistance,
    }),
    { gamesPlayed: 0, guesses: 0, exactGuesses: 0, totalDistance: 0 },
  );
  return {
    ...totals,
    averageDistance:
      totals.guesses === 0 ? 0 : totals.totalDistance / totals.guesses,
  };
}
