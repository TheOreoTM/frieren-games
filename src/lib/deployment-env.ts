import { z } from "zod";

const secret = z
  .string()
  .min(32)
  .refine((value) => !/replace|example|changeme/i.test(value), "must not be a placeholder");

export const productionEnvironmentSchema = z
  .object({
    DATABASE_URL: z
      .string()
      .refine((value) => /^postgres(?:ql)?:\/\//.test(value), "must be a PostgreSQL URL")
      .refine((value) => /sslmode=/.test(value), "must explicitly configure sslmode"),
    AUTH_SECRET: secret,
    AUTH_DISCORD_ID: z.string().min(1),
    AUTH_DISCORD_SECRET: z.string().min(1),
    ADMIN_DISCORD_ID: z.string().regex(/^\d{17,20}$/),
    GUESSR_SESSION_SECRET: secret,
    R2_PUBLIC_BASE_URL: z.string().url().refine((value) => value.startsWith("https://")),
  })
  .superRefine((environment, context) => {
    if (environment.AUTH_SECRET === environment.GUESSR_SESSION_SECRET) {
      context.addIssue({
        code: "custom",
        path: ["GUESSR_SESSION_SECRET"],
        message: "must be different from AUTH_SECRET",
      });
    }
  });

export function validateProductionEnvironment(environment: NodeJS.ProcessEnv) {
  return productionEnvironmentSchema.parse(environment);
}
