import { describe, expect, it } from "vitest";

import { parseFramePushOptions } from "./push-options";

describe("frame push options", () => {
  it("skips previously pushed frames by default", () => {
    expect(parseFramePushOptions([])).toEqual({ includePushed: false });
  });

  it("can include previously pushed frames for target recovery", () => {
    expect(parseFramePushOptions(["--all"])).toEqual({
      includePushed: true,
    });
  });

  it("rejects unknown arguments", () => {
    expect(() => parseFramePushOptions(["--force"])).toThrow(
      "Unknown argument: --force",
    );
  });
});
