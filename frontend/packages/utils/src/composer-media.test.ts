import { describe, expect, it } from "vitest";

import {
  COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
  COMPOSER_MEDIA_MAX_BYTES,
  COMPOSER_MEDIA_TOO_LARGE,
  validateComposerMediaFile,
} from "./composer-media";

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

  it("explique le refus HEIC/HEIF sans accepter le format", () => {
    for (const type of ["image/heic", "image/heif", "IMAGE/HEIC"]) {
      expect(validateComposerMediaFile({ type, size: 1 })).toEqual({
        ok: false,
        error: COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
      });
    }
  });

  it("rejette au-dessus de 20 Mo", () => {
    const result = validateComposerMediaFile({
      type: "image/png",
      size: COMPOSER_MEDIA_MAX_BYTES + 1,
    });
    expect(result).toEqual({ ok: false, error: COMPOSER_MEDIA_TOO_LARGE });
  });

  it("accepte pile à la limite (20 Mo)", () => {
    expect(
      validateComposerMediaFile({ type: "image/png", size: COMPOSER_MEDIA_MAX_BYTES }).ok,
    ).toBe(true);
  });
});
