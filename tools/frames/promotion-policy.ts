import { z } from "zod";

const targetLabelSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{2,48}$/,
    "must be 3-49 lowercase letters, numbers, or hyphens",
  );

const productionDatabaseUrlSchema = z
  .string()
  .url()
  .refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "must be a PostgreSQL URL",
  )
  .refine((value) => /[?&]sslmode=/.test(value), "must explicitly set sslmode")
  .refine((value) => {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "::1"
    );
  }, "must not target a local database");

const productionPromotionEnvironmentSchema = z.object({
  PRODUCTION_TARGET_LABEL: targetLabelSchema,
  PRODUCTION_DATABASE_URL: productionDatabaseUrlSchema,
  PRODUCTION_R2_ACCOUNT_ID: z.string().min(1),
  PRODUCTION_R2_ACCESS_KEY_ID: z.string().min(1),
  PRODUCTION_R2_SECRET_ACCESS_KEY: z.string().min(1),
  PRODUCTION_R2_BUCKET: z.string().min(1),
  PRODUCTION_R2_PUBLIC_BASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), "must use HTTPS"),
});

export type ProductionPromotionOptions = {
  apply: boolean;
  targetLabel: string;
  databaseUrl: string;
  databaseDisplay: string;
  r2PublicBaseUrl: string;
  r2: {
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET: string;
  };
};

function databaseDisplay(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  return `${url.hostname}${url.pathname}`;
}

export function parseProductionPromotionOptions(
  args: readonly string[],
  environment: Record<string, string | undefined>,
): ProductionPromotionOptions {
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

  const parsed = productionPromotionEnvironmentSchema.parse(environment);
  if (apply && confirmations[0] !== parsed.PRODUCTION_TARGET_LABEL) {
    throw new Error(
      `Writing requires --confirm=${parsed.PRODUCTION_TARGET_LABEL}.`,
    );
  }
  if (!apply && confirmations.length > 0) {
    throw new Error("--confirm is only valid together with --apply.");
  }

  return {
    apply,
    targetLabel: parsed.PRODUCTION_TARGET_LABEL,
    databaseUrl: parsed.PRODUCTION_DATABASE_URL,
    databaseDisplay: databaseDisplay(parsed.PRODUCTION_DATABASE_URL),
    r2PublicBaseUrl: parsed.PRODUCTION_R2_PUBLIC_BASE_URL,
    r2: {
      R2_ACCOUNT_ID: parsed.PRODUCTION_R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: parsed.PRODUCTION_R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: parsed.PRODUCTION_R2_SECRET_ACCESS_KEY,
      R2_BUCKET: parsed.PRODUCTION_R2_BUCKET,
    },
  };
}
