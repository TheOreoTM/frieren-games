import { describe, expect, it } from "vitest";

import {
  dailyPerformanceXp,
  deduplicateXpAwards,
  gameProgressionSummary,
  levelProgress,
  unlimitedXpGrant,
} from "./progression";

describe("progression XP", () => {
  it("deduplicates awards by source and source key", () => {
    expect(
      deduplicateXpAwards([
        { source: "DAILY_COMPLETION", sourceKey: "attempt-1", amount: 50 },
        { source: "DAILY_COMPLETION", sourceKey: "attempt-1", amount: 50 },
        { source: "DAILY_PERFORMANCE", sourceKey: "attempt-1", amount: 20 },
      ]),
    ).toHaveLength(2);
  });

  it("caps Unlimited XP at 100 per UTC day", () => {
    expect(unlimitedXpGrant(0)).toBe(10);
    expect(unlimitedXpGrant(90)).toBe(10);
    expect(unlimitedXpGrant(95)).toBe(5);
    expect(unlimitedXpGrant(100)).toBe(0);
    expect(unlimitedXpGrant(140)).toBe(0);
  });

  it("calculates modest Daily performance bonuses", () => {
    expect(dailyPerformanceXp(4_999)).toBe(0);
    expect(dailyPerformanceXp(15_000)).toBe(15);
    expect(dailyPerformanceXp(25_000)).toBe(25);
  });

  it("calculates level boundaries from cumulative XP", () => {
    expect(levelProgress(0)).toMatchObject({
      level: 1,
      earnedThisLevel: 0,
      neededThisLevel: 100,
    });
    expect(levelProgress(99).level).toBe(1);
    expect(levelProgress(100)).toMatchObject({
      level: 2,
      earnedThisLevel: 0,
      neededThisLevel: 300,
    });
    expect(levelProgress(399).level).toBe(2);
    expect(levelProgress(400).level).toBe(3);
  });

  it("summarizes XP earned by a game and detects a level up", () => {
    expect(gameProgressionSummary(110, 35)).toMatchObject({
      totalXp: 110,
      xpGained: 35,
      leveledUp: true,
      level: { level: 2, earnedThisLevel: 10, neededThisLevel: 300 },
    });
    expect(gameProgressionSummary(90, 10).leveledUp).toBe(false);
  });
});
