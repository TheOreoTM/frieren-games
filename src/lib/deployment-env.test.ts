import { describe, expect, it } from "vitest";

import { productionEnvironmentSchema } from "./deployment-env";

const validEnvironment = {
  DATABASE_URL: "postgresql://user:password@db.example.test/app?sslmode=verify-full",
  AUTH_SECRET: "auth-secret-that-is-longer-than-thirty-two-characters",
  AUTH_DISCORD_ID: "discord-client-id",
  AUTH_DISCORD_SECRET: "discord-client-secret",
  ADMIN_DISCORD_ID: "123456789012345678",
  GUESSR_SESSION_SECRET: "guessr-secret-that-is-different-and-long-enough",
  R2_PUBLIC_BASE_URL: "https://frames.example.test",
};

describe("production environment", () => {
  it("accepts a complete server configuration", () => {
    expect(productionEnvironmentSchema.safeParse(validEnvironment).success).toBe(true);
  });

  it("rejects placeholders, insecure media URLs, and missing database SSL", () => {
    expect(
      productionEnvironmentSchema.safeParse({
        ...validEnvironment,
        DATABASE_URL: "postgresql://user:password@db.example.test/app",
        AUTH_SECRET: "replace-with-a-random-auth-secret",
        R2_PUBLIC_BASE_URL: "http://frames.example.test",
      }).success,
    ).toBe(false);
  });

  it("requires independent signing secrets", () => {
    expect(
      productionEnvironmentSchema.safeParse({
        ...validEnvironment,
        GUESSR_SESSION_SECRET: validEnvironment.AUTH_SECRET,
      }).success,
    ).toBe(false);
  });
});
