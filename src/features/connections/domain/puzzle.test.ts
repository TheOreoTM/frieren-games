import { describe, expect, it } from "vitest";

import { connectionsPuzzleFixture } from "./test-fixtures";
import {
  assertValidConnectionsPuzzle,
  normalizeConnectionsText,
  validateConnectionsPuzzle,
} from "./puzzle";

describe("Connections puzzle validation", () => {
  it("accepts a complete four-by-four puzzle", () => {
    const puzzle = connectionsPuzzleFixture();

    expect(validateConnectionsPuzzle(puzzle)).toEqual([]);
    expect(() => assertValidConnectionsPuzzle(puzzle)).not.toThrow();
  });

  it("normalizes case, Unicode width, and repeated whitespace", () => {
    expect(normalizeConnectionsText("  ＦＥＲＮ\n  The Mage ")).toBe(
      "fern the mage",
    );
  });

  it("requires exactly four groups of four tiles", () => {
    const puzzle = connectionsPuzzleFixture();
    puzzle.groups.pop();
    puzzle.groups[0].tiles.pop();

    const issues = validateConnectionsPuzzle(puzzle);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "groups" }),
        expect.objectContaining({ path: "groups[0].tiles" }),
      ]),
    );
  });

  it("rejects empty labels and tile text", () => {
    const puzzle = connectionsPuzzleFixture();
    puzzle.groups[0].label = " \n ";
    puzzle.groups[0].tiles[0].text = "  ";

    const issues = validateConnectionsPuzzle(puzzle);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "groups[0].label" }),
        expect.objectContaining({ path: "groups[0].tiles[0].text" }),
      ]),
    );
  });

  it("rejects tile text duplicated with different case or whitespace", () => {
    const puzzle = connectionsPuzzleFixture();
    puzzle.groups[3].tiles[3].text = "  FRIEREN ";

    expect(validateConnectionsPuzzle(puzzle)).toContainEqual(
      expect.objectContaining({ path: "groups[3].tiles[3].text" }),
    );
  });

  it("requires unique IDs, positions, labels, and difficulties", () => {
    const puzzle = connectionsPuzzleFixture();
    puzzle.groups[1].id = puzzle.groups[0].id;
    puzzle.groups[1].position = puzzle.groups[0].position;
    puzzle.groups[1].label = " mages ";
    puzzle.groups[1].difficulty = puzzle.groups[0].difficulty;
    puzzle.groups[1].tiles[0].id = puzzle.groups[0].tiles[0].id;

    const issuePaths = validateConnectionsPuzzle(puzzle).map(
      (issue) => issue.path,
    );

    expect(issuePaths).toEqual(
      expect.arrayContaining([
        "groups[1].id",
        "groups[1].position",
        "groups[1].label",
        "groups[1].difficulty",
        "groups[1].tiles[0].id",
      ]),
    );
  });

  it("requires group positions from one through four", () => {
    const puzzle = connectionsPuzzleFixture();
    puzzle.groups[0].position = 0;

    expect(validateConnectionsPuzzle(puzzle)).toContainEqual(
      expect.objectContaining({ path: "groups[0].position" }),
    );
  });
});
