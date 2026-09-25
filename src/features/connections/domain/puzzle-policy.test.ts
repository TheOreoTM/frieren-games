import { describe, expect, it } from "vitest";

import {
  canApproveConnectionsPuzzle,
  canEditConnectionsPuzzle,
  canReturnConnectionsPuzzleToDraft,
  connectionsPuzzleDisplayState,
} from "./puzzle-policy";

const NOW = new Date("2026-09-25T12:00:00.000Z");

describe("Connections puzzle policy", () => {
  it("derives active and completed states for approved puzzles", () => {
    expect(
      connectionsPuzzleDisplayState(new Date("2026-09-25"), "APPROVED", NOW),
    ).toBe("ACTIVE");
    expect(
      connectionsPuzzleDisplayState(new Date("2026-09-24"), "APPROVED", NOW),
    ).toBe("COMPLETED");
  });

  it("keeps draft and void states explicit", () => {
    expect(
      connectionsPuzzleDisplayState(new Date("2026-09-25"), "DRAFT", NOW),
    ).toBe("DRAFT");
    expect(
      connectionsPuzzleDisplayState(new Date("2026-09-26"), "VOID", NOW),
    ).toBe("VOID");
  });

  it("only edits and approves future drafts", () => {
    expect(canEditConnectionsPuzzle(new Date("2026-09-26"), "DRAFT", NOW)).toBe(
      true,
    );
    expect(
      canApproveConnectionsPuzzle(new Date("2026-09-26"), "DRAFT", NOW),
    ).toBe(true);
    expect(canEditConnectionsPuzzle(new Date("2026-09-25"), "DRAFT", NOW)).toBe(
      false,
    );
    expect(
      canEditConnectionsPuzzle(new Date("2026-09-26"), "APPROVED", NOW),
    ).toBe(false);
  });

  it("only returns future approved puzzles to draft", () => {
    expect(
      canReturnConnectionsPuzzleToDraft(
        new Date("2026-09-26"),
        "APPROVED",
        NOW,
      ),
    ).toBe(true);
    expect(
      canReturnConnectionsPuzzleToDraft(
        new Date("2026-09-25"),
        "APPROVED",
        NOW,
      ),
    ).toBe(false);
  });
});
