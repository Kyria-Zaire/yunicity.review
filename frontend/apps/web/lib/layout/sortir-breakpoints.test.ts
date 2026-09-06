import { describe, expect, it } from "vitest";

import {
  SORTIR_VIEWPORT_DESKTOP_MIN_PX,
  SORTIR_VIEWPORT_MEDIUM_MAX_PX,
  SORTIR_VIEWPORT_MEDIUM_MIN_PX,
  SORTIR_VIEWPORT_MOBILE_MAX_PX,
} from "./sortir-breakpoints";

describe("sortir-breakpoints", () => {
  it("aligne mobile / medium / desktop sur Feed R4", () => {
    expect(SORTIR_VIEWPORT_MOBILE_MAX_PX).toBe(639);
    expect(SORTIR_VIEWPORT_MEDIUM_MIN_PX).toBe(640);
    expect(SORTIR_VIEWPORT_MEDIUM_MAX_PX).toBe(1023);
    expect(SORTIR_VIEWPORT_DESKTOP_MIN_PX).toBe(1024);
  });
});
