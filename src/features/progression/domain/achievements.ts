export const ACHIEVEMENTS = {
  FIRST_STEPS: {
    name: "First Steps",
    description: "Complete your first recorded FrierenGuessr game.",
    xp: 25,
  },
  DAILY_INITIATE: {
    name: "A New Dawn",
    description: "Complete your first ranked Daily.",
    xp: 25,
  },
  BULLSEYE: {
    name: "Bullseye",
    description: "Identify an episode exactly.",
    xp: 25,
  },
  KEEN_EYE: {
    name: "Keen Eye",
    description: "Make five exact episode guesses.",
    xp: 50,
  },
  SCHOLAR_OF_THE_ERA: {
    name: "Scholar of the Era",
    description: "Complete ten ranked Dailies.",
    xp: 100,
  },
  TENURE: {
    name: "Tenure",
    description: "Build a ten-Daily completion streak.",
    xp: 150,
  },
  TWENTY_FIVE_K: {
    name: "25K",
    description: "Finish a five-round game with a perfect score.",
    xp: 100,
  },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

export type AchievementProgress = {
  gamesPlayed: number;
  rankedDailiesCompleted: number;
  exactGuesses: number;
  dailyStreak: number;
  hasPerfectGame: boolean;
};

export function earnedAchievementIds(progress: AchievementProgress): AchievementId[] {
  const earned: AchievementId[] = [];
  if (progress.gamesPlayed >= 1) earned.push("FIRST_STEPS");
  if (progress.rankedDailiesCompleted >= 1) earned.push("DAILY_INITIATE");
  if (progress.exactGuesses >= 1) earned.push("BULLSEYE");
  if (progress.exactGuesses >= 5) earned.push("KEEN_EYE");
  if (progress.rankedDailiesCompleted >= 10) earned.push("SCHOLAR_OF_THE_ERA");
  if (progress.dailyStreak >= 10) earned.push("TENURE");
  if (progress.hasPerfectGame) earned.push("TWENTY_FIVE_K");
  return earned;
}

export function newAchievementIds(
  progress: AchievementProgress,
  unlockedIds: ReadonlySet<string>,
): AchievementId[] {
  return earnedAchievementIds(progress).filter((id) => !unlockedIds.has(id));
}
