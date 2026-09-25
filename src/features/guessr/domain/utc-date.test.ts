import { describe, expect, it } from "vitest";

import { enumerateUtcDates, parseUtcDateKey, utcDateKey } from "./utc-date";

describe("UTC Daily dates", () => {
  it("round-trips strict UTC date keys", () => {
    expect(utcDateKey(parseUtcDateKey("2026-09-23"))).toBe("2026-09-23");
    expect(() => parseUtcDateKey("2026-02-30")).toThrow();
  });

  it("enumerates arbitrary inclusive date ranges", () => {
    expect(
      enumerateUtcDates(new Date("2026-09-29"), new Date("2026-10-02")).map(
        utcDateKey,
      ),
    ).toEqual(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
  });
});
