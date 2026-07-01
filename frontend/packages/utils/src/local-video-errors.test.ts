import { describe, expect, it } from "vitest";

import { AuthError } from "./auth/auth-errors";
import {
  humanizeLocalVideoError,
  isLocalVideoProcessingFailed,
  isLocalVideoProcessingReady,
  LocalVideoError,
  toLocalVideoError,
} from "./local-video-errors";

describe("local-video-errors", () => {
  it("humanizeLocalVideoError maps invalid content", () => {
    const err = new LocalVideoError(
      "LOCAL_VIDEO_INVALID_CONTENT",
      "Le contenu du fichier ne correspond pas au type déclaré.",
      400,
    );
    expect(humanizeLocalVideoError(err, "fallback")).toContain("format vidéo");
  });

  it("humanizeLocalVideoError maps upload expired", () => {
    const err = new AuthError("LOCAL_VIDEO_UPLOAD_EXPIRED", "Session expirée.", 410);
    expect(humanizeLocalVideoError(err, "fallback")).toContain("expirée");
  });

  it("humanizeLocalVideoError maps rate limit", () => {
    const err = toLocalVideoError(
      new AuthError("RATE_LIMITED", "Too many requests", 429),
    );
    expect(humanizeLocalVideoError(err, "fallback")).toContain("Trop de tentatives");
  });

  it("humanizeLocalVideoError maps too long with pilot duration limit", () => {
    const err = new LocalVideoError("LOCAL_VIDEO_TOO_LONG", "Vidéo trop longue (max. 90 s).", 400);
    expect(humanizeLocalVideoError(err, "fallback")).toContain("90 s");
  });

  it("detects processing ready and failed states", () => {
    expect(
      isLocalVideoProcessingReady({ status: "published", processing_status: "ready" }),
    ).toBe(true);
    expect(
      isLocalVideoProcessingFailed({ status: "failed", processing_status: "failed" }),
    ).toBe(true);
    expect(
      isLocalVideoProcessingFailed({ status: "processing", processing_status: "processing" }),
    ).toBe(false);
  });
});
