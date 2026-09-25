import path from "node:path";

import { describe, expect, it } from "vitest";

import { isPathInsideRoot, requirePathInsideRoot } from "./paths";

describe("curator path containment", () => {
  const root = path.resolve("/media/frieren");

  it("allows nested media paths", () => {
    expect(
      isPathInsideRoot(root, path.join(root, "season-1", "S01E01.mkv")),
    ).toBe(true);
  });

  it("rejects the root itself and sibling-prefix paths", () => {
    expect(isPathInsideRoot(root, root)).toBe(false);
    expect(
      isPathInsideRoot(root, path.resolve("/media/frieren-backup/S01E01.mkv")),
    ).toBe(false);
  });

  it("rejects traversal outside the configured root", () => {
    expect(() =>
      requirePathInsideRoot(root, path.join(root, "..", "secret.mkv")),
    ).toThrow("outside CURATOR_MEDIA_ROOT");
  });
});
