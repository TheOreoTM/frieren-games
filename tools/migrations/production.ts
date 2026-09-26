import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

import { z } from "zod";

import { parseProductionMigrationOptions } from "./production-policy";

const require = createRequire(import.meta.url);

function errorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map(
        (issue) =>
          `${issue.path.join(".") || "configuration"}: ${issue.message}`,
      )
      .join("; ");
  }
  return error instanceof Error ? error.message : String(error);
}

function main() {
  const options = parseProductionMigrationOptions(
    process.argv.slice(2),
    process.env,
  );
  const command = options.apply ? "deploy" : "status";

  console.log(`Target: ${options.targetLabel}`);
  console.log(`Database: ${options.databaseDisplay}`);
  console.log(`Mode: ${options.apply ? "APPLY" : "STATUS (no writes)"}`);

  const result = spawnSync(
    process.execPath,
    [require.resolve("prisma/build/index.js"), "migrate", command],
    {
      env: { ...process.env, DATABASE_URL: options.databaseUrl },
      stdio: "inherit",
    },
  );

  if (result.error) throw result.error;
  if (result.signal) {
    throw new Error(`Prisma exited after receiving ${result.signal}.`);
  }
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

try {
  main();
} catch (error: unknown) {
  console.error(`Production migration command aborted: ${errorMessage(error)}`);
  process.exitCode = 1;
}
