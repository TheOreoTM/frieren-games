"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  approveDaily,
  generateDailyRange,
  regenerateDaily,
  replaceDailyRound,
  voidDaily,
} from "@/features/guessr/server/daily-admin";
import { parseUtcDateKey } from "@/features/guessr/domain/utc-date";
import { requireAdmin } from "@/lib/authorization";

const challengeIdSchema = z.string().cuid();
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

function monthFrom(formData: FormData) {
  return (
    monthSchema.safeParse(formData.get("month")).data ??
    new Date().toISOString().slice(0, 7)
  );
}

function finish(month: string, notice: string) {
  revalidatePath("/admin/dailies");
  redirect(
    `/admin/dailies?month=${month}&notice=${encodeURIComponent(notice)}`,
  );
}

function errorNotice(error: unknown) {
  return `Error: ${error instanceof Error ? error.message : "The Daily operation failed."}`;
}

export async function generateDailies(formData: FormData) {
  await requireAdmin("/admin/dailies");
  const input = z
    .object({ start: z.string(), end: z.string() })
    .parse(Object.fromEntries(formData));
  let notice: string;
  try {
    const result = await generateDailyRange(
      parseUtcDateKey(input.start),
      parseUtcDateKey(input.end),
    );
    notice = `Generated ${result.created}; skipped ${result.skipped} existing.`;
  } catch (error) {
    notice = errorNotice(error);
  }
  finish(input.start.slice(0, 7), notice);
}

export async function approveDailyAction(formData: FormData) {
  await requireAdmin("/admin/dailies");
  const id = challengeIdSchema.parse(formData.get("challengeId"));
  const month = monthFrom(formData);
  let notice = "Daily approved.";
  try {
    await approveDaily(id);
  } catch (error) {
    notice = errorNotice(error);
  }
  finish(month, notice);
}

export async function regenerateDailyAction(formData: FormData) {
  await requireAdmin("/admin/dailies");
  const id = challengeIdSchema.parse(formData.get("challengeId"));
  const month = monthFrom(formData);
  let notice = "Daily regenerated as a draft.";
  try {
    await regenerateDaily(id);
  } catch (error) {
    notice = errorNotice(error);
  }
  finish(month, notice);
}

export async function replaceDailyRoundAction(formData: FormData) {
  await requireAdmin("/admin/dailies");
  const input = z
    .object({
      challengeId: challengeIdSchema,
      roundNumber: z.coerce.number().int().min(1).max(5),
    })
    .parse(Object.fromEntries(formData));
  const month = monthFrom(formData);
  let notice = `Round ${input.roundNumber} replaced; Daily returned to draft.`;
  try {
    await replaceDailyRound(input.challengeId, input.roundNumber);
  } catch (error) {
    notice = errorNotice(error);
  }
  finish(month, notice);
}

export async function voidDailyAction(formData: FormData) {
  await requireAdmin("/admin/dailies");
  const input = z
    .object({
      challengeId: challengeIdSchema,
      confirmVoid: z.literal("yes"),
    })
    .safeParse(Object.fromEntries(formData));
  const month = monthFrom(formData);
  if (!input.success) {
    return finish(
      month,
      "Error: Confirm that ranked results should be invalidated.",
    );
  }
  let notice = "Daily voided. Ranked scores are no longer valid.";
  try {
    await voidDaily(input.data.challengeId);
  } catch (error) {
    notice = errorNotice(error);
  }
  finish(month, notice);
}
