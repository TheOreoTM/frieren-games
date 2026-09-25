import "server-only";

import {
  ConnectionsPuzzleStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { startOfUtcDate } from "@/lib/utc-date";

import { projectConnectionsPuzzle } from "../domain/attempt";
import type { AnonymousConnectionsSession } from "../domain/session-token";
import { deterministicShuffle } from "../domain/shuffle";
import type { ConnectionsPuzzle } from "../domain/types";

const puzzleWithAnswers = {
  groups: {
    orderBy: { position: "asc" as const },
    include: { tiles: { orderBy: { id: "asc" as const } } },
  },
} satisfies Prisma.ConnectionsPuzzleInclude;

type StoredPuzzle = Prisma.ConnectionsPuzzleGetPayload<{
  include: typeof puzzleWithAnswers;
}>;

function storedPuzzleToDomain(puzzle: StoredPuzzle): ConnectionsPuzzle {
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

export async function getCurrentConnectionsPuzzle(
  now = new Date(),
): Promise<ConnectionsPuzzle | null> {
  const puzzle = await getDb().connectionsPuzzle.findFirst({
    where: {
      dateUtc: startOfUtcDate(now),
      status: ConnectionsPuzzleStatus.APPROVED,
    },
    include: puzzleWithAnswers,
  });
  return puzzle ? storedPuzzleToDomain(puzzle) : null;
}

export async function getActiveConnectionsPuzzle(
  puzzleId: string,
  now = new Date(),
): Promise<ConnectionsPuzzle | null> {
  const puzzle = await getDb().connectionsPuzzle.findFirst({
    where: {
      id: puzzleId,
      dateUtc: startOfUtcDate(now),
      status: ConnectionsPuzzleStatus.APPROVED,
    },
    include: puzzleWithAnswers,
  });
  return puzzle ? storedPuzzleToDomain(puzzle) : null;
}

export function projectAnonymousConnectionsSession(
  puzzle: ConnectionsPuzzle,
  session: AnonymousConnectionsSession,
) {
  const solvedGroupIds = new Set(session.state.solvedGroupIds);
  const unsolvedTiles =
    session.state.status === "IN_PROGRESS"
      ? puzzle.groups
          .filter((group) => !solvedGroupIds.has(group.id))
          .flatMap((group) => group.tiles)
      : [];
  const presentationIds = deterministicShuffle(
    unsolvedTiles,
    session.attemptId,
  ).map((tile) => tile.id);

  return projectConnectionsPuzzle(puzzle, session.state, presentationIds);
}
