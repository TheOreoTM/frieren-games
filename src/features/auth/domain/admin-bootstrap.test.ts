import { describe, expect, it } from "vitest";

import { isBootstrapAdmin } from "./admin-bootstrap";

describe("isBootstrapAdmin", () => {
  it("matches only the exact configured Discord account ID", () => {
    expect(isBootstrapAdmin("123", "123")).toBe(true);
    expect(isBootstrapAdmin("123", " 123 ")).toBe(true);
    expect(isBootstrapAdmin("123", "0123")).toBe(false);
    expect(isBootstrapAdmin("123", undefined)).toBe(false);
    expect(isBootstrapAdmin("", "")).toBe(false);
  });
});
