"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { setFrameDifficulty, setFrameEnabled } from "@/data/frames";
import { requireAdmin } from "@/lib/authorization";

const frameIdSchema = z.string().regex(/^[a-f0-9]{32}$/);

export async function updateFrameDifficulty(formData: FormData) {
  await requireAdmin();
  const input = z
    .object({
      id: frameIdSchema,
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    })
    .parse(Object.fromEntries(formData));

  await setFrameDifficulty(input.id, input.difficulty);
  revalidatePath("/admin/frames");
}

export async function updateFrameEnabled(formData: FormData) {
  await requireAdmin();
  const input = z
    .object({
      id: frameIdSchema,
      enabled: z.enum(["true", "false"]).transform((value) => value === "true"),
    })
    .parse(Object.fromEntries(formData));

  await setFrameEnabled(input.id, input.enabled);
  revalidatePath("/admin/frames");
}
