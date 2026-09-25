"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { CONNECTIONS_DIFFICULTIES } from "@/features/connections/domain/types";
import {
  approveConnectionsPuzzle,
  returnConnectionsPuzzleToDraft,
  saveConnectionsPuzzleDraft,
  voidConnectionsPuzzle,
} from "@/features/connections/server/admin";
import { requireAdmin } from "@/lib/authorization";
import { addUtcDays, parseUtcDateKey, utcDateKey } from "@/lib/utc-date";

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const puzzleIdSchema = z.string().cuid();
const difficultySchema = z.enum(CONNECTIONS_DIFFICULTIES);

const draftSchema = z.object({
  date: dateKeySchema,
  spoilerNote: z.string().max(500),
  groups: z
    .array(
      z.object({
        position: z.number().int().min(1).max(4),
        difficulty: difficultySchema,
        label: z.string().max(120),
        explanation: z.string().max(500),
        tiles: z.array(z.string().max(80)).length(4),
      }),
    )
    .length(4),
});

function dateContext(formData: FormData): string {
  return (
    dateKeySchema.safeParse(formData.get("date")).data ??
    utcDateKey(addUtcDays(new Date(), 1))
  );
}

function finish(date: string, notice: string): never {
  revalidatePath("/admin/connections");
  redirect(
    `/admin/connections?month=${date.slice(0, 7)}&date=${date}&notice=${encodeURIComponent(notice)}`,
  );
}

function errorNotice(error: unknown): string {
  if (error instanceof z.ZodError) {
    return `Error: ${error.issues[0]?.message ?? "The puzzle form is invalid."}`;
  }
  return `Error: ${error instanceof Error ? error.message : "The Connections operation failed."}`;
}

function readDraft(formData: FormData) {
  return draftSchema.parse({
    date: formData.get("date"),
    spoilerNote: formData.get("spoilerNote") ?? "",
    groups: CONNECTIONS_DIFFICULTIES.map((_, groupIndex) => ({
      position: groupIndex + 1,
      difficulty: formData.get(`groups.${groupIndex}.difficulty`),
      label: formData.get(`groups.${groupIndex}.label`) ?? "",
      explanation: formData.get(`groups.${groupIndex}.explanation`) ?? "",
      tiles: Array.from(
        { length: 4 },
        (_, tileIndex) =>
          formData.get(`groups.${groupIndex}.tiles.${tileIndex}`) ?? "",
      ),
    })),
  });
}

function readPuzzleActionInput(formData: FormData) {
  return {
    puzzleId: puzzleIdSchema.parse(formData.get("puzzleId")),
    date: dateKeySchema.parse(formData.get("date")),
  };
}

export async function saveConnectionsPuzzleAction(formData: FormData) {
  await requireAdmin("/admin/connections");
  const date = dateContext(formData);
  let notice = "Puzzle draft saved.";

  try {
    const input = readDraft(formData);
    await saveConnectionsPuzzleDraft({
      dateUtc: parseUtcDateKey(input.date),
      spoilerNote: input.spoilerNote,
      groups: input.groups,
    });
  } catch (error) {
    notice = errorNotice(error);
  }

  finish(date, notice);
}

export async function approveConnectionsPuzzleAction(formData: FormData) {
  await requireAdmin("/admin/connections");
  const date = dateContext(formData);
  let notice = "Puzzle approved.";

  try {
    const input = readPuzzleActionInput(formData);
    await approveConnectionsPuzzle(input.puzzleId);
  } catch (error) {
    notice = errorNotice(error);
  }

  finish(date, notice);
}

export async function returnConnectionsPuzzleToDraftAction(formData: FormData) {
  await requireAdmin("/admin/connections");
  const date = dateContext(formData);
  let notice = "Puzzle returned to draft and can now be edited.";

  try {
    const input = readPuzzleActionInput(formData);
    await returnConnectionsPuzzleToDraft(input.puzzleId);
  } catch (error) {
    notice = errorNotice(error);
  }

  finish(date, notice);
}

export async function voidConnectionsPuzzleAction(formData: FormData) {
  await requireAdmin("/admin/connections");
  const date = dateContext(formData);
  let notice = "Puzzle voided. Ranked results will not count.";

  try {
    const input = z
      .object({
        puzzleId: puzzleIdSchema,
        date: dateKeySchema,
        confirmVoid: z.literal("yes"),
      })
      .parse({
        puzzleId: formData.get("puzzleId"),
        date: formData.get("date"),
        confirmVoid: formData.get("confirmVoid"),
      });
    await voidConnectionsPuzzle(input.puzzleId);
  } catch (error) {
    notice = errorNotice(error);
  }

  finish(date, notice);
}
