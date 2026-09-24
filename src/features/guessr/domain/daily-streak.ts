export function calculateDailyStreak(
  challengeIdsInOrder: readonly string[],
  completedChallengeIds: ReadonlySet<string>,
  currentChallengeId?: string,
): number {
  let lastIndex = challengeIdsInOrder.length - 1;
  if (
    currentChallengeId &&
    challengeIdsInOrder[lastIndex] === currentChallengeId &&
    !completedChallengeIds.has(currentChallengeId)
  ) {
    lastIndex -= 1;
  }

  let streak = 0;
  for (let index = lastIndex; index >= 0; index -= 1) {
    if (!completedChallengeIds.has(challengeIdsInOrder[index])) break;
    streak += 1;
  }
  return streak;
}
