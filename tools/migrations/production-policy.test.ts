import { describe, expect, it } from "vitest";

import { parseProductionMigrationOptions } from "./production-policy";

const environment = {
  PRODUCTION_TARGET_LABEL: "frieren-production",
  PRODUCTION_DATABASE_URL:
    "postgresql://user:secret@production.neon.tech/neondb?sslmode=require",
};

describe("production migration policy", () => {
  it("defaults to a read-only migration status check", () => {
    expect(parseProductionMigrationOptions([], environment)).toMatchObject({
      apply: false,
      targetLabel: "frieren-production",
      databaseDisplay: "production.neon.tech/neondb",
    });
  });

  it("requires the exact target label before applying migrations", () => {
    expect(() =>
      parseProductionMigrationOptions(["--apply"], environment),
    ).toThrow("--confirm=frieren-production");

    expect(
      parseProductionMigrationOptions(
        ["--apply", "--confirm=frieren-production"],
        environment,
      ).apply,
    ).toBe(true);
  });

  it("rejects unknown arguments and confirmation in status mode", () => {
    expect(() =>
      parseProductionMigrationOptions(["--force"], environment),
    ).toThrow("Unknown argument");
    expect(() =>
      parseProductionMigrationOptions(
        ["--confirm=frieren-production"],
        environment,
      ),
    ).toThrow("only valid together with --apply");
  });

  it("rejects local and non-TLS database targets", () => {
    expect(() =>
      parseProductionMigrationOptions([], {
        ...environment,
        PRODUCTION_DATABASE_URL:
          "postgresql://user:secret@localhost/neondb?sslmode=require",
      }),
    ).toThrow("must not target a local database");
    expect(() =>
      parseProductionMigrationOptions([], {
        ...environment,
        PRODUCTION_DATABASE_URL:
          "postgresql://user:secret@production.neon.tech/neondb",
      }),
    ).toThrow("must explicitly set sslmode");
  });

  it("does not expose database credentials in the display target", () => {
    const options = parseProductionMigrationOptions([], environment);

    expect(options.databaseDisplay).not.toContain("user");
    expect(options.databaseDisplay).not.toContain("secret");
  });
});
