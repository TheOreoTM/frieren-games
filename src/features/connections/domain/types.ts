export const CONNECTIONS_GROUP_COUNT = 4;
export const CONNECTIONS_GROUP_SIZE = 4;
export const CONNECTIONS_TILE_COUNT =
  CONNECTIONS_GROUP_COUNT * CONNECTIONS_GROUP_SIZE;
export const CONNECTIONS_MAX_MISTAKES = 4;

export const CONNECTIONS_DIFFICULTIES = [
  "EASY",
  "MEDIUM",
  "HARD",
  "TRICKY",
] as const;

export type ConnectionsDifficulty = (typeof CONNECTIONS_DIFFICULTIES)[number];

export type ConnectionsTile = {
  id: string;
  text: string;
};

export type ConnectionsGroup = {
  id: string;
  position: number;
  difficulty: ConnectionsDifficulty;
  label: string;
  explanation?: string | null;
  tiles: ConnectionsTile[];
};

export type ConnectionsPuzzle = {
  id: string;
  spoilerNote?: string | null;
  groups: ConnectionsGroup[];
};

export type ConnectionsAttemptStatus = "IN_PROGRESS" | "SOLVED" | "FAILED";

export type ConnectionsAttemptState = {
  status: ConnectionsAttemptStatus;
  solvedGroupIds: string[];
  incorrectSubmissionSignatures: string[];
  mistakes: number;
};
