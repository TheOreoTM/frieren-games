import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig, env } from "prisma/config";

// Prisma runs outside Next.js, so it does not load `.env.local` automatically.
if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --env-file-if-exists=.env.local --import tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
