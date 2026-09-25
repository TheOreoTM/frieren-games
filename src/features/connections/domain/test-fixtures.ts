import type { ConnectionsPuzzle } from "./types";

export function connectionsPuzzleFixture(): ConnectionsPuzzle {
  return {
    id: "puzzle-1",
    spoilerNote: "Season 1 spoilers",
    groups: [
      {
        id: "group-a",
        position: 1,
        difficulty: "EASY",
        label: "Mages",
        explanation: "Characters who use magic.",
        tiles: [
          { id: "tile-01", text: "Frieren" },
          { id: "tile-02", text: "Fern" },
          { id: "tile-03", text: "Flamme" },
          { id: "tile-04", text: "Serie" },
        ],
      },
      {
        id: "group-b",
        position: 2,
        difficulty: "MEDIUM",
        label: "Places",
        tiles: [
          { id: "tile-05", text: "Auberst" },
          { id: "tile-06", text: "Waal" },
          { id: "tile-07", text: "Bredt" },
          { id: "tile-08", text: "Tür" },
        ],
      },
      {
        id: "group-c",
        position: 3,
        difficulty: "HARD",
        label: "Spells",
        tiles: [
          { id: "tile-09", text: "Zoltraak" },
          { id: "tile-10", text: "Reelseiden" },
          { id: "tile-11", text: "Sorganeil" },
          { id: "tile-12", text: "Jilwer" },
        ],
      },
      {
        id: "group-d",
        position: 4,
        difficulty: "TRICKY",
        label: "Demons",
        tiles: [
          { id: "tile-13", text: "Aura" },
          { id: "tile-14", text: "Lügner" },
          { id: "tile-15", text: "Linie" },
          { id: "tile-16", text: "Draht" },
        ],
      },
    ],
  };
}

export function groupTileIds(
  puzzle: ConnectionsPuzzle,
  groupIndex: number,
): string[] {
  return puzzle.groups[groupIndex].tiles.map((tile) => tile.id);
}
