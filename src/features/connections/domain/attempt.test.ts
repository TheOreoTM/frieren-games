import { describe, expect, it } from "vitest";

import {
  ConnectionsRuleError,
  createConnectionsAttemptState,
  evaluateConnectionsSubmission,
  projectConnectionsPuzzle,
} from "./attempt";
import { connectionsPuzzleFixture, groupTileIds } from "./test-fixtures";

describe("Connections attempt rules", () => {
  it("locks an exact group without consuming a mistake", () => {
    const puzzle = connectionsPuzzleFixture();

    const result = evaluateConnectionsSubmission(
      puzzle,
      createConnectionsAttemptState(),
      groupTileIds(puzzle, 0),
    );

    expect(result).toMatchObject({
      kind: "CORRECT",
      matchedGroupId: "group-a",
      state: {
        status: "IN_PROGRESS",
        solvedGroupIds: ["group-a"],
        mistakes: 0,
      },
    });
  });

  it("reports one away when three selected tiles share an unsolved group", () => {
    const puzzle = connectionsPuzzleFixture();
    const selection = [
      ...groupTileIds(puzzle, 0).slice(0, 3),
      groupTileIds(puzzle, 1)[0],
    ];

    const result = evaluateConnectionsSubmission(
      puzzle,
      createConnectionsAttemptState(),
      selection,
    );

    expect(result).toMatchObject({
      kind: "INCORRECT",
      oneAway: true,
      state: { mistakes: 1, status: "IN_PROGRESS" },
    });
  });

  it("does not report one away for a two-and-two split", () => {
    const puzzle = connectionsPuzzleFixture();
    const selection = [
      ...groupTileIds(puzzle, 0).slice(0, 2),
      ...groupTileIds(puzzle, 1).slice(0, 2),
    ];

    expect(
      evaluateConnectionsSubmission(
        puzzle,
        createConnectionsAttemptState(),
        selection,
      ),
    ).toMatchObject({ kind: "INCORRECT", oneAway: false });
  });

  it("rejects a repeated incorrect combination without another penalty", () => {
    const puzzle = connectionsPuzzleFixture();
    const selection = [
      ...groupTileIds(puzzle, 0).slice(0, 2),
      ...groupTileIds(puzzle, 1).slice(0, 2),
    ];
    const first = evaluateConnectionsSubmission(
      puzzle,
      createConnectionsAttemptState(),
      selection,
    );
    const originalState = structuredClone(first.state);

    const repeated = evaluateConnectionsSubmission(
      puzzle,
      first.state,
      [...selection].reverse(),
    );

    expect(repeated).toEqual({ kind: "DUPLICATE", state: originalState });
    expect(first.state).toEqual(originalState);
  });

  it("fails on the fourth distinct incorrect submission", () => {
    const puzzle = connectionsPuzzleFixture();
    const wrongSelections = [
      ["tile-01", "tile-02", "tile-05", "tile-06"],
      ["tile-01", "tile-03", "tile-05", "tile-07"],
      ["tile-02", "tile-04", "tile-06", "tile-08"],
      ["tile-09", "tile-10", "tile-13", "tile-14"],
    ];
    let state = createConnectionsAttemptState();

    for (const selection of wrongSelections) {
      state = evaluateConnectionsSubmission(puzzle, state, selection).state;
    }

    expect(state).toMatchObject({ status: "FAILED", mistakes: 4 });
  });

  it("solves the attempt when the fourth group is found", () => {
    const puzzle = connectionsPuzzleFixture();
    let state = createConnectionsAttemptState();

    for (let groupIndex = 0; groupIndex < 4; groupIndex += 1) {
      state = evaluateConnectionsSubmission(
        puzzle,
        state,
        groupTileIds(puzzle, groupIndex),
      ).state;
    }

    expect(state).toMatchObject({
      status: "SOLVED",
      solvedGroupIds: ["group-a", "group-b", "group-c", "group-d"],
      mistakes: 0,
    });
  });

  it.each([
    {
      selection: ["tile-01", "tile-02", "tile-03"],
      code: "SELECTION_SIZE",
    },
    {
      selection: ["tile-01", "tile-01", "tile-02", "tile-03"],
      code: "DUPLICATE_TILE",
    },
    {
      selection: ["tile-01", "tile-02", "tile-03", "not-a-tile"],
      code: "UNKNOWN_TILE",
    },
  ])("rejects invalid selections with $code", ({ selection, code }) => {
    const puzzle = connectionsPuzzleFixture();

    try {
      evaluateConnectionsSubmission(
        puzzle,
        createConnectionsAttemptState(),
        selection,
      );
      throw new Error("Expected submission to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ConnectionsRuleError);
      expect((error as ConnectionsRuleError).code).toBe(code);
    }
  });

  it("rejects tiles from a solved group", () => {
    const puzzle = connectionsPuzzleFixture();
    const solved = evaluateConnectionsSubmission(
      puzzle,
      createConnectionsAttemptState(),
      groupTileIds(puzzle, 0),
    ).state;

    expect(() =>
      evaluateConnectionsSubmission(puzzle, solved, groupTileIds(puzzle, 0)),
    ).toThrow(expect.objectContaining({ code: "SOLVED_TILE" }));
  });

  it("rejects submissions after an attempt ends", () => {
    const puzzle = connectionsPuzzleFixture();
    const state = {
      ...createConnectionsAttemptState(),
      status: "FAILED" as const,
      mistakes: 4,
    };

    expect(() =>
      evaluateConnectionsSubmission(puzzle, state, groupTileIds(puzzle, 0)),
    ).toThrow(expect.objectContaining({ code: "ATTEMPT_ENDED" }));
  });
});

describe("Connections player projection", () => {
  it("does not expose unsolved group answers", () => {
    const puzzle = connectionsPuzzleFixture();
    const tileOrder = puzzle.groups.flatMap((group) =>
      group.tiles.map((tile) => tile.id),
    );

    const projection = projectConnectionsPuzzle(
      puzzle,
      createConnectionsAttemptState(),
      tileOrder,
    );
    const serialized = JSON.stringify(projection);

    expect(projection.revealedGroups).toEqual([]);
    expect(projection.tiles).toHaveLength(16);
    expect(serialized).not.toContain("Mages");
    expect(serialized).not.toContain("group-a");
    expect(serialized).not.toContain("Characters who use magic");
  });

  it("reveals a solved group and removes its tiles from the board", () => {
    const puzzle = connectionsPuzzleFixture();
    const state = evaluateConnectionsSubmission(
      puzzle,
      createConnectionsAttemptState(),
      groupTileIds(puzzle, 0),
    ).state;
    const remainingTileIds = puzzle.groups
      .slice(1)
      .flatMap((group) => group.tiles.map((tile) => tile.id));

    const projection = projectConnectionsPuzzle(
      puzzle,
      state,
      remainingTileIds,
    );

    expect(projection.tiles).toHaveLength(12);
    expect(projection.revealedGroups).toEqual([
      expect.objectContaining({ id: "group-a", label: "Mages" }),
    ]);
  });

  it("reveals every answer when an attempt ends", () => {
    const puzzle = connectionsPuzzleFixture();
    const state = {
      ...createConnectionsAttemptState(),
      status: "FAILED" as const,
      mistakes: 4,
    };

    const projection = projectConnectionsPuzzle(puzzle, state, []);

    expect(projection.tiles).toEqual([]);
    expect(projection.revealedGroups).toHaveLength(4);
  });

  it("rejects incomplete presentation orders", () => {
    const puzzle = connectionsPuzzleFixture();

    expect(() =>
      projectConnectionsPuzzle(puzzle, createConnectionsAttemptState(), [
        "tile-01",
      ]),
    ).toThrow(expect.objectContaining({ code: "INVALID_PRESENTATION_ORDER" }));
  });
});
