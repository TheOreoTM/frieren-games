"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { ConnectionsActionState } from "@/features/connections/components/connections-board";
import {
  ConnectionsRuleError,
  createConnectionsAttemptState,
  evaluateConnectionsSubmission,
} from "@/features/connections/domain/attempt";
import { createAnonymousConnectionsSession } from "@/features/connections/domain/session-token";
import {
  getActiveConnectionsPuzzle,
  getCurrentConnectionsPuzzle,
  projectAnonymousConnectionsSession,
} from "@/features/connections/server/game";
import {
  readAnonymousConnectionsSession,
  writeAnonymousConnectionsSession,
} from "@/features/connections/server/session";

const selectionSchema = z
  .array(z.string().min(1).max(64))
  .length(4)
  .refine((tileIds) => new Set(tileIds).size === tileIds.length);

export async function startAnonymousConnections(): Promise<never> {
  const puzzle = await getCurrentConnectionsPuzzle();
  if (!puzzle) redirect("/connections");

  const existing = await readAnonymousConnectionsSession();
  if (!existing || existing.puzzleId !== puzzle.id) {
    await writeAnonymousConnectionsSession(
      createAnonymousConnectionsSession(
        puzzle.id,
        createConnectionsAttemptState(),
      ),
    );
  }
  redirect("/connections");
}

export async function submitAnonymousConnections(
  previousState: ConnectionsActionState,
  formData: FormData,
): Promise<ConnectionsActionState> {
  const session = await readAnonymousConnectionsSession();
  if (!session) {
    return {
      ...previousState,
      feedback: null,
      error:
        "This attempt has expired. Reload the page to start today’s puzzle.",
    };
  }

  const puzzle = await getActiveConnectionsPuzzle(session.puzzleId);
  if (!puzzle) {
    return {
      ...previousState,
      feedback: null,
      error: "Today’s puzzle is no longer available.",
    };
  }

  const parsed = selectionSchema.safeParse(formData.getAll("tileId"));
  if (!parsed.success) {
    return {
      puzzle: projectAnonymousConnectionsSession(puzzle, session),
      feedback: null,
      error: "Select exactly four different tiles.",
    };
  }

  try {
    const result = evaluateConnectionsSubmission(
      puzzle,
      session.state,
      parsed.data,
    );
    const nextSession = { ...session, state: result.state };
    await writeAnonymousConnectionsSession(nextSession);

    const feedback =
      result.kind === "CORRECT"
        ? ({ kind: "CORRECT", message: "Group found." } as const)
        : result.kind === "DUPLICATE"
          ? ({
              kind: "DUPLICATE",
              message: "You already tried that combination.",
            } as const)
          : result.oneAway
            ? ({ kind: "ONE_AWAY", message: "One away…" } as const)
            : ({ kind: "INCORRECT", message: "Not a group." } as const);

    return {
      puzzle: projectAnonymousConnectionsSession(puzzle, nextSession),
      feedback,
      error: null,
    };
  } catch (error) {
    return {
      puzzle: projectAnonymousConnectionsSession(puzzle, session),
      feedback: null,
      error:
        error instanceof ConnectionsRuleError
          ? error.message
          : "That selection could not be checked. Please try again.",
    };
  }
}
