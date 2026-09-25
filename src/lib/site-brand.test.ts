import { describe, expect, it } from "vitest";

import { resolveSiteBrand } from "./site-brand";

describe("site brand scheduling", () => {
  it("uses the normal identity outside a scheduled occasion", () => {
    expect(resolveSiteBrand(new Date("2027-03-31T23:59:59Z"), "").key).toBe(
      "default",
    );
    expect(resolveSiteBrand(new Date("2027-04-02T00:00:00Z"), "").key).toBe(
      "default",
    );
  });

  it("uses Nyamon for every April Fools' Day in UTC", () => {
    expect(resolveSiteBrand(new Date("2027-04-01T00:00:00Z"), "").key).toBe(
      "nyamon",
    );
    expect(resolveSiteBrand(new Date("2032-04-01T23:59:59Z"), "").key).toBe(
      "nyamon",
    );
  });

  it("lets a valid override force either identity", () => {
    const aprilFools = new Date("2027-04-01T12:00:00Z");
    const ordinaryDay = new Date("2027-08-18T12:00:00Z");

    expect(resolveSiteBrand(aprilFools, "default").key).toBe("default");
    expect(resolveSiteBrand(ordinaryDay, "nyamon").key).toBe("nyamon");
  });
});
