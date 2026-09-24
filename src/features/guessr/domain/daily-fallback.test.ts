import { describe, expect, it } from "vitest";

import { ensurePersistedDaily } from "./daily-fallback";

describe("ensurePersistedDaily", () => {
  it("returns the persisted fallback rather than generating again", async () => {
    const values = new Map<string, { id: string }>();
    let createCount = 0;
    const repository = {
      async find(dateKey: string) {
        return values.get(dateKey) ?? null;
      },
      async create(dateKey: string) {
        createCount += 1;
        const challenge = { id: `daily-${createCount}` };
        values.set(dateKey, challenge);
        return challenge;
      },
      isDateConflict() {
        return false;
      },
    };

    const first = await ensurePersistedDaily("2026-09-23", repository);
    const second = await ensurePersistedDaily("2026-09-23", repository);

    expect(second).toBe(first);
    expect(createCount).toBe(1);
  });

  it("loads the winning row after a concurrent unique-date conflict", async () => {
    const winner = { id: "winner" };
    let reads = 0;
    const result = await ensurePersistedDaily("2026-09-23", {
      async find() {
        reads += 1;
        return reads === 1 ? null : winner;
      },
      async create() {
        throw new Error("unique date");
      },
      isDateConflict() {
        return true;
      },
    });

    expect(result).toBe(winner);
  });
});
