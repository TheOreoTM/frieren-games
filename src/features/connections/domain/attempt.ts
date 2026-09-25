import {
  CONNECTIONS_GROUP_COUNT,
  CONNECTIONS_GROUP_SIZE,
  CONNECTIONS_MAX_MISTAKES,
  type ConnectionsAttemptState,
  type ConnectionsPuzzle,
  type ConnectionsTile,
} from "./types";

export type ConnectionsRuleErrorCode =
  | "ATTEMPT_ENDED"
  | "DUPLICATE_TILE"
  | "INVALID_PRESENTATION_ORDER"
  | "SELECTION_SIZE"
  | "SOLVED_TILE"
  | "UNKNOWN_TILE";

export class ConnectionsRuleError extends Error {
  constructor(
    public readonly code: ConnectionsRuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ConnectionsRuleError";
  }
}

export type ConnectionsSubmissionResult =
  | {
      kind: "CORRECT";
      matchedGroupId: string;
      state: ConnectionsAttemptState;
    }
  | {
      kind: "INCORRECT";
      oneAway: boolean;
      state: ConnectionsAttemptState;
    }
  | {
      kind: "DUPLICATE";
      state: ConnectionsAttemptState;
    };

export type ConnectionsPlayerGroup = {
  id: string;
  position: number;
  label: string;
  explanation: string | null;
  tiles: ConnectionsTile[];
};

export type ConnectionsPlayerPuzzle = {
  id: string;
  spoilerNote: string | null;
  status: ConnectionsAttemptState["status"];
  mistakesRemaining: number;
  tiles: ConnectionsTile[];
  revealedGroups: ConnectionsPlayerGroup[];
};

export function createConnectionsAttemptState(): ConnectionsAttemptState {
  return {
    status: "IN_PROGRESS",
    solvedGroupIds: [],
    incorrectSubmissionSignatures: [],
    mistakes: 0,
  };
}

function submissionSignature(tileIds: readonly string[]): string {
  return JSON.stringify([...tileIds].sort());
}

function copyAttemptState(
  state: ConnectionsAttemptState,
): ConnectionsAttemptState {
  return {
    ...state,
    solvedGroupIds: [...state.solvedGroupIds],
    incorrectSubmissionSignatures: [...state.incorrectSubmissionSignatures],
  };
}

export function evaluateConnectionsSubmission(
  puzzle: ConnectionsPuzzle,
  state: ConnectionsAttemptState,
  selectedTileIds: readonly string[],
): ConnectionsSubmissionResult {
  if (state.status !== "IN_PROGRESS") {
    throw new ConnectionsRuleError(
      "ATTEMPT_ENDED",
      "This Connections attempt has already ended.",
    );
  }
  if (selectedTileIds.length !== CONNECTIONS_GROUP_SIZE) {
    throw new ConnectionsRuleError(
      "SELECTION_SIZE",
      `Select exactly ${CONNECTIONS_GROUP_SIZE} tiles.`,
    );
  }

  const selectedIds = new Set(selectedTileIds);
  if (selectedIds.size !== selectedTileIds.length) {
    throw new ConnectionsRuleError(
      "DUPLICATE_TILE",
      "A tile can only appear once in a submission.",
    );
  }

  const tileToGroup = new Map<string, string>();
  for (const group of puzzle.groups) {
    for (const tile of group.tiles) tileToGroup.set(tile.id, group.id);
  }

  const solvedGroupIds = new Set(state.solvedGroupIds);
  for (const tileId of selectedTileIds) {
    const groupId = tileToGroup.get(tileId);
    if (!groupId) {
      throw new ConnectionsRuleError(
        "UNKNOWN_TILE",
        "The submission contains a tile outside this puzzle.",
      );
    }
    if (solvedGroupIds.has(groupId)) {
      throw new ConnectionsRuleError(
        "SOLVED_TILE",
        "Solved tiles cannot be submitted again.",
      );
    }
  }

  const signature = submissionSignature(selectedTileIds);
  if (state.incorrectSubmissionSignatures.includes(signature)) {
    return { kind: "DUPLICATE", state: copyAttemptState(state) };
  }

  const unsolvedGroups = puzzle.groups.filter(
    (group) => !solvedGroupIds.has(group.id),
  );
  const matchedGroup = unsolvedGroups.find(
    (group) =>
      group.tiles.length === selectedIds.size &&
      group.tiles.every((tile) => selectedIds.has(tile.id)),
  );

  if (matchedGroup) {
    const nextSolvedGroupIds = [...state.solvedGroupIds, matchedGroup.id];
    return {
      kind: "CORRECT",
      matchedGroupId: matchedGroup.id,
      state: {
        ...copyAttemptState(state),
        status:
          nextSolvedGroupIds.length === CONNECTIONS_GROUP_COUNT
            ? "SOLVED"
            : "IN_PROGRESS",
        solvedGroupIds: nextSolvedGroupIds,
      },
    };
  }

  const mistakes = state.mistakes + 1;
  const oneAway = unsolvedGroups.some(
    (group) =>
      group.tiles.filter((tile) => selectedIds.has(tile.id)).length ===
      CONNECTIONS_GROUP_SIZE - 1,
  );

  return {
    kind: "INCORRECT",
    oneAway,
    state: {
      ...copyAttemptState(state),
      status: mistakes >= CONNECTIONS_MAX_MISTAKES ? "FAILED" : "IN_PROGRESS",
      mistakes,
      incorrectSubmissionSignatures: [
        ...state.incorrectSubmissionSignatures,
        signature,
      ],
    },
  };
}

export function projectConnectionsPuzzle(
  puzzle: ConnectionsPuzzle,
  state: ConnectionsAttemptState,
  presentationTileIds: readonly string[],
): ConnectionsPlayerPuzzle {
  const solvedGroupIds = new Set(state.solvedGroupIds);
  const revealAll = state.status !== "IN_PROGRESS";
  const revealedGroups = puzzle.groups
    .filter((group) => revealAll || solvedGroupIds.has(group.id))
    .sort((left, right) => left.position - right.position)
    .map((group) => ({
      id: group.id,
      position: group.position,
      label: group.label,
      explanation: group.explanation ?? null,
      tiles: group.tiles.map((tile) => ({ ...tile })),
    }));

  const visibleTiles = puzzle.groups
    .filter((group) => !revealAll && !solvedGroupIds.has(group.id))
    .flatMap((group) => group.tiles);
  const visibleTilesById = new Map(visibleTiles.map((tile) => [tile.id, tile]));
  const suppliedIds = new Set(presentationTileIds);

  if (
    presentationTileIds.length !== visibleTiles.length ||
    suppliedIds.size !== presentationTileIds.length ||
    presentationTileIds.some((tileId) => !visibleTilesById.has(tileId))
  ) {
    throw new ConnectionsRuleError(
      "INVALID_PRESENTATION_ORDER",
      "Presentation order must contain every currently unsolved tile exactly once.",
    );
  }

  return {
    id: puzzle.id,
    spoilerNote: puzzle.spoilerNote ?? null,
    status: state.status,
    mistakesRemaining: Math.max(0, CONNECTIONS_MAX_MISTAKES - state.mistakes),
    tiles: presentationTileIds.map((tileId) => ({
      ...visibleTilesById.get(tileId)!,
    })),
    revealedGroups,
  };
}
