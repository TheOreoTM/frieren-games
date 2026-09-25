import { describe, expect, it } from "vitest";

import { parseProductionPromotionOptions } from "./promotion-policy";

const environment = {
  PRODUCTION_TARGET_LABEL: "frieren-production",
  PRODUCTION_DATABASE_URL:
    "postgresql://user:secret@production.neon.tech/neondb?sslmode=require",
  PRODUCTION_R2_ACCOUNT_ID: "account",
  PRODUCTION_R2_ACCESS_KEY_ID: "access",
  PRODUCTION_R2_SECRET_ACCESS_KEY: "secret",
  PRODUCTION_R2_BUCKET: "frames-production",
  PRODUCTION_R2_PUBLIC_BASE_URL: "https://frames.example.com",
};

describe("production frame promotion policy", () => {
  it("defaults to a non-writing dry run", () => {
    expect(parseProductionPromotionOptions([], environment)).toMatchObject({
      apply: false,
      targetLabel: "frieren-production",
      databaseDisplay: "production.neon.tech/neondb",
      r2PublicBaseUrl: "https://frames.example.com",
      r2: { R2_BUCKET: "frames-production" },
    });
  });

  it("requires the exact target label before writing", () => {
    expect(() =>
      parseProductionPromotionOptions(["--apply"], environment),
    ).toThrow("--confirm=frieren-production");
    expect(() =>
      parseProductionPromotionOptions(
        ["--apply", "--confirm=somewhere-else"],
        environment,
      ),
    ).toThrow("--confirm=frieren-production");

    expect(
      parseProductionPromotionOptions(
        ["--apply", "--confirm=frieren-production"],
        environment,
      ).apply,
    ).toBe(true);
  });

  it("rejects confirmation on a dry run and unknown arguments", () => {
    expect(() =>
      parseProductionPromotionOptions(
        ["--confirm=frieren-production"],
        environment,
      ),
    ).toThrow("only valid together with --apply");
    expect(() =>
      parseProductionPromotionOptions(["--force"], environment),
    ).toThrow("Unknown argument");
  });

  it("rejects local or non-TLS database targets", () => {
    expect(() =>
      parseProductionPromotionOptions([], {
        ...environment,
        PRODUCTION_DATABASE_URL:
          "postgresql://user:secret@localhost/neondb?sslmode=require",
      }),
    ).toThrow("must not target a local database");
    expect(() =>
      parseProductionPromotionOptions([], {
        ...environment,
        PRODUCTION_DATABASE_URL:
          "postgresql://user:secret@production.neon.tech/neondb",
      }),
    ).toThrow("must explicitly set sslmode");
  });

  it("never includes credentials in the display target", () => {
    const options = parseProductionPromotionOptions([], environment);

    expect(options.databaseDisplay).not.toContain("user");
    expect(options.databaseDisplay).not.toContain("secret");
  });
});
