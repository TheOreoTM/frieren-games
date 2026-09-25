export type RankedScore<T> = T & { totalScore: number };

export type RankedEntry<T> = RankedScore<T> & { rank: number };

export function assignSharedRanks<T>(
  entries: RankedScore<T>[],
): RankedEntry<T>[] {
  const sorted = [...entries].sort(
    (left, right) => right.totalScore - left.totalScore,
  );
  let previousScore: number | undefined;
  let rank = 0;

  return sorted.map((entry, index) => {
    if (entry.totalScore !== previousScore) rank = index + 1;
    previousScore = entry.totalScore;
    return { ...entry, rank };
  });
}
