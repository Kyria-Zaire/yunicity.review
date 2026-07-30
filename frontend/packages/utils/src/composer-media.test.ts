import { describe, expect, it } from "vitest";

import { COMPOSER_MEDIA_MAX_BYTES, validateComposerMediaFile } from "./composer-media";

describe("validateComposerMediaFile", () => {
  it("accepte jpeg / png / webp sous la limite", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateComposerMediaFile({ type, size: 1024 })).toEqual({ ok: true });
    }
  });

  it("normalise le type MIME (casse + paramètre)", () => {
    expect(validateComposerMediaFile({ type: "IMAGE/JPEG; charset=binary", size: 1 }).ok).toBe(true);
  });

  it("rejette un format non image", () => {
    expect(validateComposerMediaFile({ type: "application/pdf", size: 1 }).ok).toBe(false);
  });

  it("rejette la vidéo (image seulement pour ce bloc)", () => {
    expect(validateComposerMediaFile({ type: "video/mp4", size: 1 }).ok).toBe(false);
  });

  it("rejette au-dessus de 20 Mo", () => {
    const result = validateComposerMediaFile({
      type: "image/png",
      size: COMPOSER_MEDIA_MAX_BYTES + 1,
    });
    expect(result).toEqual({ ok: false, error: expect.any(String) });
  });

  it("accepte pile à la limite (20 Mo)", () => {
    expect(
      validateComposerMediaFile({ type: "image/png", size: COMPOSER_MEDIA_MAX_BYTES }).ok,
    ).toBe(true);
  });
});
