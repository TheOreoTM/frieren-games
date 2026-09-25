export const DAILY_COMPLETION_XP = 50;
export const UNLIMITED_COMPLETION_XP = 10;
export const UNLIMITED_DAILY_XP_CAP = 100;

export function dailyPerformanceXp(totalScore: number): number {
  if (!Number.isInteger(totalScore) || totalScore < 0 || totalScore > 25_000) {
    throw new Error("Daily score must be an integer between 0 and 25,000.");
  }
  return Math.floor(totalScore / 5_000) * 5;
}

export function unlimitedXpGrant(earnedToday: number): number {
  if (!Number.isInteger(earnedToday) || earnedToday < 0) {
    throw new Error("Earned XP must be a non-negative integer.");
  }
  return Math.min(
    UNLIMITED_COMPLETION_XP,
    Math.max(0, UNLIMITED_DAILY_XP_CAP - earnedToday),
  );
}

export function xpRequiredForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) throw new Error("Level must be positive.");
  return 100 * (level - 1) ** 2;
}

export function levelProgress(totalXp: number) {
  if (!Number.isInteger(totalXp) || totalXp < 0) {
    throw new Error("Total XP must be a non-negative integer.");
  }
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  const levelStartXp = xpRequiredForLevel(level);
  const nextLevelXp = xpRequiredForLevel(level + 1);
  return {
    level,
    levelStartXp,
    nextLevelXp,
    earnedThisLevel: totalXp - levelStartXp,
    neededThisLevel: nextLevelXp - levelStartXp,
  };
}

export function gameProgressionSummary(totalXp: number, xpGained: number) {
  if (!Number.isInteger(xpGained) || xpGained < 0 || xpGained > totalXp) {
    throw new Error("XP gained must be a non-negative integer no greater than total XP.");
  }

  const level = levelProgress(totalXp);
  const previousLevel = levelProgress(totalXp - xpGained).level;

  return {
    totalXp,
    xpGained,
    level,
    leveledUp: level.level > previousLevel,
  };
}

export type XPAward = {
  source: string;
  sourceKey: string;
  amount: number;
};

export function deduplicateXpAwards(awards: readonly XPAward[]): XPAward[] {
  const byIdentity = new Map<string, XPAward>();
  for (const award of awards) {
    const identity = `${award.source}:${award.sourceKey}`;
    if (!byIdentity.has(identity)) byIdentity.set(identity, award);
  }
  return [...byIdentity.values()];
}
