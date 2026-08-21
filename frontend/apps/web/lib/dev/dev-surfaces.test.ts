import { describe, expect, it } from "vitest";

import { isDevOnlySurfaceEnabled } from "./dev-surfaces";

describe("dev-surfaces — C3.1-R1B", () => {
  it("expose les surfaces de diagnostic uniquement hors production", () => {
    expect(isDevOnlySurfaceEnabled("development")).toBe(true);
    expect(isDevOnlySurfaceEnabled("test")).toBe(true);
    expect(isDevOnlySurfaceEnabled(undefined)).toBe(true);
    expect(isDevOnlySurfaceEnabled("production")).toBe(false);
  });
});
