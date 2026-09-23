import { z } from "zod";

import { usernameSchema } from "./username";

export const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(usernameSchema),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(40, "Display name must be at most 40 characters."),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
