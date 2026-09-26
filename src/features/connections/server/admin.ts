import "server-only";

import {
  ConnectionsPuzzleStatus as DbConnectionsPuzzleStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { startOfUtcDate, utcDateKey } from "@/lib/utc-date";

import {
  canApproveConnectionsPuzzle,
  canEditConnectionsPuzzle,
  canReturnConnectionsPuzzleToDraft,
  connectionsPuzzleDisplayState,
} from "../domain/puzzle-policy";
import {
  normalizeConnectionsText,
  validateConnectionsPuzzle,
} from "../domain/puzzle";
import type { ConnectionsPuzzle } from "../domain/types";

export type ConnectionsPuzzleDraftInput = {
  dateUtc: Date;
  spoilerNote?: string | null;
  groups: Array<{
    position: number;
    label: string;
    explanation?: string | null;
    tiles: string[];
  }>;
};

const puzzleWithAnswers = {
  groups: {
    orderBy: { position: "asc" as const },
    include: { tiles: { orderBy: { id: "asc" as const } } },
  },
  _count: { select: { attempts: true } },
};

type StoredConnectionsPuzzle = Prisma.ConnectionsPuzzleGetPayload<{
  include: typeof puzzleWithAnswers;
}>;

function cleanText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function cleanOptionalText(value?: string | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function validationPuzzle(
  input: ConnectionsPuzzleDraftInput,
): ConnectionsPuzzle {
  return {
    id: "draft",
    spoilerNote: cleanOptionalText(input.spoilerNote),
    groups: input.groups.map((group, groupIndex) => ({
      id: `draft-group-${groupIndex}`,
      position: group.position,
      label: cleanText(group.label),
      explanation: cleanOptionalText(group.explanation),
      tiles: group.tiles.map((text, tileIndex) => ({
        id: `draft-tile-${groupIndex}-${tileIndex}`,
        text: cleanText(text),
      })),
    })),
  };
}

function assertValidDraft(
  input: ConnectionsPuzzleDraftInput,
): ConnectionsPuzzle {
  const puzzle = validationPuzzle(input);
  const issues = validateConnectionsPuzzle(puzzle);
  if (issues.length > 0) {
    throw new Error(
      issues.map((issue) => `${issue.path}: ${issue.message}`).join(" "),
    );
  }
  return puzzle;
}

function storedPuzzleToDomain(
  puzzle: StoredConnectionsPuzzle,
): ConnectionsPuzzle {
  return {
    id: puzzle.id,
    spoilerNote: puzzle.spoilerNote,
    groups: puzzle.groups.map((group) => ({
      id: group.id,
      position: group.position,
      label: group.label,
      explanation: group.explanation,
      tiles: group.tiles.map((tile) => ({ id: tile.id, text: tile.text })),
    })),
  };
}

function assertValidStoredPuzzle(puzzle: StoredConnectionsPuzzle): void {
  const issues = validateConnectionsPuzzle(storedPuzzleToDomain(puzzle));
  if (issues.length > 0) {
    throw new Error(
      `Puzzle is not ready to approve. ${issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join(" ")}`,
    );
  }
}

export async function saveConnectionsPuzzleDraft(
  input: ConnectionsPuzzleDraftInput,
  now = new Date(),
) {
  const dateUtc = startOfUtcDate(input.dateUtc);
  const puzzle = assertValidDraft({ ...input, dateUtc });

  return getDb().$transaction(
    async (database) => {
      const existing = await database.connectionsPuzzle.findUnique({
        where: { dateUtc },
        include: puzzleWithAnswers,
      });

      if (
        existing &&
        !canEditConnectionsPuzzle(existing.dateUtc, existing.status, now)
      ) {
        throw new Error(
          "Only future draft puzzles can be edited. Return an approved future puzzle to draft first.",
        );
      }
      if (!existing && dateUtc <= startOfUtcDate(now)) {
        throw new Error(
          "Connections puzzles can only be created for future UTC dates.",
        );
      }

      const stored = existing
        ? await database.connectionsPuzzle.update({
            where: { id: existing.id },
            data: { spoilerNote: puzzle.spoilerNote },
          })
        : await database.connectionsPuzzle.create({
            data: {
              dateUtc,
              spoilerNote: puzzle.spoilerNote,
              status: DbConnectionsPuzzleStatus.DRAFT,
            },
          });

      if (existing) {
        await database.connectionsGroup.deleteMany({
          where: { puzzleId: stored.id },
        });
      }

      for (const group of puzzle.groups) {
        await database.connectionsGroup.create({
          data: {
            puzzle: { connect: { id: stored.id } },
            position: group.position,
            label: group.label,
            explanation: group.explanation,
            tiles: {
              create: group.tiles.map((tile) => ({
                text: tile.text,
                normalizedText: normalizeConnectionsText(tile.text),
              })),
            },
          },
        });
      }

      return database.connectionsPuzzle.findUniqueOrThrow({
        where: { id: stored.id },
        include: puzzleWithAnswers,
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function approveConnectionsPuzzle(
  puzzleId: string,
  now = new Date(),
) {
  return getDb().$transaction(async (database) => {
    const puzzle = await database.connectionsPuzzle.findUnique({
      where: { id: puzzleId },
      include: puzzleWithAnswers,
    });
    if (
      !puzzle ||
      !canApproveConnectionsPuzzle(puzzle.dateUtc, puzzle.status, now)
    ) {
      throw new Error("Only future draft puzzles can be approved.");
    }

    assertValidStoredPuzzle(puzzle);
    return database.connectionsPuzzle.update({
      where: { id: puzzle.id },
      data: {
        status: DbConnectionsPuzzleStatus.APPROVED,
        approvedAt: now,
        voidedAt: null,
      },
    });
  });
}

export async function returnConnectionsPuzzleToDraft(
  puzzleId: string,
  now = new Date(),
) {
  return getDb().$transaction(async (database) => {
    const puzzle = await database.connectionsPuzzle.findUnique({
      where: { id: puzzleId },
      select: { id: true, dateUtc: true, status: true },
    });
    if (
      !puzzle ||
      !canReturnConnectionsPuzzleToDraft(puzzle.dateUtc, puzzle.status, now)
    ) {
      throw new Error("Only future approved puzzles can be returned to draft.");
    }

    return database.connectionsPuzzle.update({
      where: { id: puzzle.id },
      data: {
        status: DbConnectionsPuzzleStatus.DRAFT,
        approvedAt: null,
      },
    });
  });
}

export async function voidConnectionsPuzzle(
  puzzleId: string,
  now = new Date(),
) {
  return getDb().$transaction(async (database) => {
    const puzzle = await database.connectionsPuzzle.findUnique({
      where: { id: puzzleId },
      select: { id: true, status: true },
    });
    if (!puzzle || puzzle.status === DbConnectionsPuzzleStatus.VOID) {
      throw new Error("This Connections puzzle cannot be voided.");
    }

    return database.connectionsPuzzle.update({
      where: { id: puzzle.id },
      data: {
        status: DbConnectionsPuzzleStatus.VOID,
        voidedAt: now,
      },
    });
  });
}

export async function listAdminConnectionsPuzzles(
  firstDate: Date,
  lastDate: Date,
  now = new Date(),
) {
  const puzzles = await getDb().connectionsPuzzle.findMany({
    where: {
      dateUtc: {
        gte: startOfUtcDate(firstDate),
        lte: startOfUtcDate(lastDate),
      },
    },
    orderBy: { dateUtc: "asc" },
    include: puzzleWithAnswers,
  });

  return puzzles.map((puzzle) => ({
    ...puzzle,
    dateKey: utcDateKey(puzzle.dateUtc),
    displayState: connectionsPuzzleDisplayState(
      puzzle.dateUtc,
      puzzle.status,
      now,
    ),
    editable: canEditConnectionsPuzzle(puzzle.dateUtc, puzzle.status, now),
    canReturnToDraft: canReturnConnectionsPuzzleToDraft(
      puzzle.dateUtc,
      puzzle.status,
      now,
    ),
    domainPuzzle: storedPuzzleToDomain(puzzle),
  }));
}
