import { expect, test } from "@playwright/test";
import { Client } from "pg";

type PuzzleGroup = {
  position: number;
  label: string;
  tiles: string[];
};

type PuzzleRow = {
  position: number;
  label: string;
  tile_text: string;
};

test("completes today's anonymous Connections puzzle", async ({ page }) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required for the Connections browser test.",
    );
  }

  const dateKey = new Date().toISOString().slice(0, 10);
  const database = new Client({ connectionString });
  await database.connect();
  let rows: PuzzleRow[];
  try {
    const result = await database.query<PuzzleRow>(
      `SELECT
        groups."position",
        groups."label",
        tiles."text" AS tile_text
      FROM "ConnectionsPuzzle" AS puzzle
      JOIN "ConnectionsGroup" AS groups ON groups."puzzleId" = puzzle."id"
      JOIN "ConnectionsTile" AS tiles ON tiles."groupId" = groups."id"
      WHERE puzzle."dateUtc" = $1::date
        AND puzzle."status" = 'APPROVED'
      ORDER BY groups."position", tiles."id"`,
      [dateKey],
    );
    rows = result.rows;
  } finally {
    await database.end();
  }

  if (rows.length !== 16) {
    throw new Error(
      `Approve a complete Connections puzzle for ${dateKey} before running the browser test.`,
    );
  }
  const groups = rows.reduce<PuzzleGroup[]>((result, row) => {
    const group = result.find((item) => item.position === row.position);
    if (group) group.tiles.push(row.tile_text);
    else
      result.push({
        position: row.position,
        label: row.label,
        tiles: [row.tile_text],
      });
    return result;
  }, []);

  await page.goto("/connections");
  await page.getByRole("button", { name: "Start today's puzzle" }).click();

  for (const group of groups) {
    for (const tile of group.tiles) {
      await page.getByRole("button", { name: tile, exact: true }).click();
    }
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(
      page.getByRole("heading", { name: group.label }),
    ).toBeVisible();
  }

  await expect(page.getByText("All connections found.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("All connections found.")).toBeVisible();
});
