import { LocalVideoError } from "@yunicity/utils";
import { describe, expect, it } from "vitest";

import { classifyDesktopOverlayDirectError } from "./desktop-overlay-direct-error";

describe("classifyDesktopOverlayDirectError", () => {
  it("classe 404 / LOCAL_VIDEO_NOT_FOUND en unavailable (C4)", () => {
    expect(
      classifyDesktopOverlayDirectError(
        new LocalVideoError("LOCAL_VIDEO_NOT_FOUND", "gone", 404),
      ).kind,
    ).toBe("unavailable");
  });

  it("classe 401 en auth (D2 / session)", () => {
    expect(
      classifyDesktopOverlayDirectError(new LocalVideoError("UNAUTHORIZED", "nope", 401)).kind,
    ).toBe("auth");
    expect(classifyDesktopOverlayDirectError({ status: 401, code: "UNAUTHORIZED" }).kind).toBe(
      "auth",
    );
  });

  it("classe 5xx et erreurs réseau en load_error (C7)", () => {
    expect(
      classifyDesktopOverlayDirectError(new LocalVideoError("UNKNOWN_ERROR", "boom", 500)).kind,
    ).toBe("load_error");
    expect(classifyDesktopOverlayDirectError(new TypeError("Failed to fetch")).kind).toBe(
      "load_error",
    );
  });
});
