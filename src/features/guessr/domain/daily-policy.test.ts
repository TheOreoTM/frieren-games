import { describe, expect, it } from "vitest";

import {
  canEditDailyComposition,
  dailyAttemptPlan,
  dailyDisplayState,
  isReservedForUnlimited,
} from "./daily-policy";

const now = new Date("2026-09-23T14:00:00.000Z");

describe("Daily policy", () => {
  it("locks composition at the UTC date boundary", () => {
    expect(canEditDailyComposition(new Date("2026-09-24"), "DRAFT", now)).toBe(true);
    expect(canEditDailyComposition(new Date("2026-09-23"), "APPROVED", now)).toBe(false);
    expect(canEditDailyComposition(new Date("2026-09-22"), "APPROVED", now)).toBe(false);
    expect(canEditDailyComposition(new Date("2026-09-24"), "VOID", now)).toBe(false);
  });

  it("derives active and completed states from UTC instead of a cron", () => {
    expect(dailyDisplayState(new Date("2026-09-23"), "APPROVED", now)).toBe("ACTIVE");
    expect(dailyDisplayState(new Date("2026-09-22"), "APPROVED", now)).toBe("COMPLETED");
    expect(dailyDisplayState(new Date("2026-09-24"), "DRAFT", now)).toBe("DRAFT");
  });

  it("reserves current and future non-void frames from Unlimited", () => {
    expect(isReservedForUnlimited([{ dateUtc: new Date("2026-09-24"), status: "DRAFT" }], now)).toBe(true);
    expect(isReservedForUnlimited([{ dateUtc: new Date("2026-09-23"), status: "APPROVED" }], now)).toBe(true);
    expect(isReservedForUnlimited([{ dateUtc: new Date("2026-09-22"), status: "APPROVED" }], now)).toBe(false);
    expect(isReservedForUnlimited([{ dateUtc: new Date("2026-09-24"), status: "VOID" }], now)).toBe(false);
  });

  it("creates one ranked attempt, resumes it, then makes replays practice", () => {
    expect(dailyAttemptPlan(null)).toBe("CREATE_RANKED");
    expect(dailyAttemptPlan({ completed: false })).toBe("RESUME_RANKED");
    expect(dailyAttemptPlan({ completed: true })).toBe("CREATE_PRACTICE");
  });
});
