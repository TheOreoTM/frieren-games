import {
  CONNECTIONS_GROUP_COUNT,
  CONNECTIONS_GROUP_SIZE,
  CONNECTIONS_TILE_COUNT,
  type ConnectionsPuzzle,
} from "./types";

export type ConnectionsPuzzleValidationIssue = {
  path: string;
  message: string;
};

export function normalizeConnectionsText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export function validateConnectionsPuzzle(
  puzzle: ConnectionsPuzzle,
): ConnectionsPuzzleValidationIssue[] {
  const issues: ConnectionsPuzzleValidationIssue[] = [];

  if (!puzzle.id.trim()) {
    issues.push({ path: "id", message: "Puzzle ID is required." });
  }

  if (puzzle.groups.length !== CONNECTIONS_GROUP_COUNT) {
    issues.push({
      path: "groups",
      message: `A puzzle must contain exactly ${CONNECTIONS_GROUP_COUNT} groups.`,
    });
  }

  const groupIds = new Set<string>();
  const positions = new Set<number>();
  const labels = new Set<string>();
  const tileIds = new Set<string>();
  const tileTexts = new Set<string>();

  for (const [groupIndex, group] of puzzle.groups.entries()) {
    const groupPath = `groups[${groupIndex}]`;

    if (!group.id.trim()) {
      issues.push({
        path: `${groupPath}.id`,
        message: "Group ID is required.",
      });
    } else if (groupIds.has(group.id)) {
      issues.push({
        path: `${groupPath}.id`,
        message: "Group IDs must be unique within a puzzle.",
      });
    }
    groupIds.add(group.id);

    if (
      !Number.isInteger(group.position) ||
      group.position < 1 ||
      group.position > CONNECTIONS_GROUP_COUNT
    ) {
      issues.push({
        path: `${groupPath}.position`,
        message: `Group position must be an integer from 1 to ${CONNECTIONS_GROUP_COUNT}.`,
      });
    } else if (positions.has(group.position)) {
      issues.push({
        path: `${groupPath}.position`,
        message: "Group positions must be unique within a puzzle.",
      });
    }
    positions.add(group.position);

    const normalizedLabel = normalizeConnectionsText(group.label);
    if (!normalizedLabel) {
      issues.push({
        path: `${groupPath}.label`,
        message: "Group label is required.",
      });
    } else if (labels.has(normalizedLabel)) {
      issues.push({
        path: `${groupPath}.label`,
        message: "Group labels must be unique within a puzzle.",
      });
    }
    labels.add(normalizedLabel);

    if (group.tiles.length !== CONNECTIONS_GROUP_SIZE) {
      issues.push({
        path: `${groupPath}.tiles`,
        message: `A group must contain exactly ${CONNECTIONS_GROUP_SIZE} tiles.`,
      });
    }

    for (const [tileIndex, tile] of group.tiles.entries()) {
      const tilePath = `${groupPath}.tiles[${tileIndex}]`;

      if (!tile.id.trim()) {
        issues.push({
          path: `${tilePath}.id`,
          message: "Tile ID is required.",
        });
      } else if (tileIds.has(tile.id)) {
        issues.push({
          path: `${tilePath}.id`,
          message: "Tile IDs must be unique within a puzzle.",
        });
      }
      tileIds.add(tile.id);

      const normalizedText = normalizeConnectionsText(tile.text);
      if (!normalizedText) {
        issues.push({
          path: `${tilePath}.text`,
          message: "Tile text is required.",
        });
      } else if (tileTexts.has(normalizedText)) {
        issues.push({
          path: `${tilePath}.text`,
          message: "Tile text must be unique within a puzzle.",
        });
      }
      tileTexts.add(normalizedText);
    }
  }

  if (
    puzzle.groups.flatMap((group) => group.tiles).length !==
    CONNECTIONS_TILE_COUNT
  ) {
    issues.push({
      path: "groups",
      message: `A puzzle must contain exactly ${CONNECTIONS_TILE_COUNT} tiles.`,
    });
  }

  return issues;
}

export function assertValidConnectionsPuzzle(puzzle: ConnectionsPuzzle): void {
  const issues = validateConnectionsPuzzle(puzzle);
  if (issues.length > 0) {
    throw new Error(
      `Invalid Connections puzzle: ${issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; ")}`,
    );
  }
}
