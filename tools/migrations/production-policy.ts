import { z } from "zod";

const productionMigrationEnvironmentSchema = z.object({
  PRODUCTION_TARGET_LABEL: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{2,48}$/,
      "must be 3-49 lowercase letters, numbers, or hyphens",
    ),
  PRODUCTION_DATABASE_URL: z
    .string()
    .url()
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "must be a PostgreSQL URL",
    )
    .refine(
      (value) => /[?&]sslmode=/.test(value),
      "must explicitly set sslmode",
    )
    .refine((value) => {
      const hostname = new URL(value).hostname.toLowerCase();
      return !["localhost", "127.0.0.1", "::1"].includes(hostname);
    }, "must not target a local database"),
});

export type ProductionMigrationOptions = {
  apply: boolean;
  targetLabel: string;
  databaseUrl: string;
  databaseDisplay: string;
};

export function parseProductionMigrationOptions(
  args: readonly string[],
  environment: Record<string, string | undefined>,
): ProductionMigrationOptions {
  const unknown = args.filter(
    (argument) => argument !== "--apply" && !argument.startsWith("--confirm="),
  );
  if (unknown.length > 0) {
    throw new Error(`Unknown argument: ${unknown[0]}`);
  }

  const apply = args.includes("--apply");
  const confirmations = args
    .filter((argument) => argument.startsWith("--confirm="))
    .map((argument) => argument.slice("--confirm=".length));
  if (confirmations.length > 1) {
    throw new Error("Provide --confirm only once.");
  }

  const parsed = productionMigrationEnvironmentSchema.parse(environment);
  if (apply && confirmations[0] !== parsed.PRODUCTION_TARGET_LABEL) {
    throw new Error(
      `Applying migrations requires --confirm=${parsed.PRODUCTION_TARGET_LABEL}.`,
    );
  }
  if (!apply && confirmations.length > 0) {
    throw new Error("--confirm is only valid together with --apply.");
  }

  const database = new URL(parsed.PRODUCTION_DATABASE_URL);
  return {
    apply,
    targetLabel: parsed.PRODUCTION_TARGET_LABEL,
    databaseUrl: parsed.PRODUCTION_DATABASE_URL,
    databaseDisplay: `${database.hostname}${database.pathname}`,
  };
}
