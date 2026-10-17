import { describe, expect, it } from "vitest";

import {
  validateLegacySidecar08,
  validateVisibleMediaSidecar,
  type VisibleMediaSidecar,
} from "@/lib/videos/visible-media-sidecar";

const PORTRAIT_ID = "68ff31cd-4890-471b-b9e2-7bece74dfaf6";
const LANDSCAPE_ID = "0ebe632d-4bec-4159-96a3-778ef2278a1f";

function basePlayerSidecar(overrides: Partial<VisibleMediaSidecar> = {}): VisibleMediaSidecar {
  return {
    SCREENSHOT: "v10-01-real-portrait-mobile-390x844.png",
    "SCREENSHOT-SHA256": "abc123",
    "CAPTURED-AT": "2026-09-05T10:00:00.000Z",
    VIEWPORT: "390x844",
    ZOOM: 100,
    ROUTE: `/videos?video=${PORTRAIT_ID}`,
    "EXPECTED-VIDEO-ID": PORTRAIT_ID,
    "OBSERVED-VIDEO-ID": PORTRAIT_ID,
    "OBSERVED-TITLE": "QA C3 — Vidéo réelle portrait",
    "CURRENT-SRC": `http://localhost:8010/media/local-video/reims/${PORTRAIT_ID}/processed.mp4`,
    "VIDEO-WIDTH": 720,
    "VIDEO-HEIGHT": 1328,
    DURATION: 5.64,
    "OBJECT-FIT": "cover",
    "OBJECT-POSITION": "50% 50%",
    VISIBLE: true,
    "INTERSECTION-RATIO": 0.92,
    "VIDEO-BOUNDS": { x: 0, y: 0, width: 390, height: 719 },
    "CONTAINER-BOUNDS": { x: 0, y: 0, width: 390, height: 719 },
    VALID: true,
    ...overrides,
  };
}

function baseDesktopCardSidecar(overrides: Partial<VisibleMediaSidecar> = {}): VisibleMediaSidecar {
  return {
    SCREENSHOT: "v10-05-real-portrait-desktop-1366x900.png",
    "SCREENSHOT-SHA256": "def456",
    "CAPTURED-AT": "2026-09-05T10:00:00.000Z",
    VIEWPORT: "1366x900",
    ZOOM: 100,
    ROUTE: "/videos",
    "EXPECTED-VIDEO-ID": PORTRAIT_ID,
    "CARD-VIDEO-ID": PORTRAIT_ID,
    "CARD-TITLE": "QA C3 — Vidéo réelle portrait",
    "CARD-HREF": `/videos?video=${PORTRAIT_ID}`,
    "CARD-BOUNDS": { x: 32, y: 120, width: 900, height: 640 },
    "CARD-FULLY-IN-VIEWPORT": true,
    VALID: true,
    ...overrides,
  };
}

describe("validateVisibleMediaSidecar", () => {
  it("accepte un sidecar player conforme portrait", () => {
    const result = validateVisibleMediaSidecar(basePlayerSidecar(), {
      expectedOrientation: "portrait",
    });
    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("accepte un sidecar desktop card conforme", () => {
    const result = validateVisibleMediaSidecar(baseDesktopCardSidecar(), {
      expectedOrientation: "portrait",
      mode: "desktop-card",
    });
    expect(result.valid).toBe(true);
  });

  it("rejette OBSERVED-TITLE vide", () => {
    const result = validateVisibleMediaSidecar(
      basePlayerSidecar({ "OBSERVED-TITLE": "", VALID: false }),
      { expectedOrientation: "portrait" },
    );
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("empty OBSERVED-TITLE");
  });

  it("rejette UUID observé différent", () => {
    const result = validateVisibleMediaSidecar(
      basePlayerSidecar({ "OBSERVED-VIDEO-ID": LANDSCAPE_ID, VALID: false }),
      { expectedOrientation: "portrait" },
    );
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("OBSERVED-VIDEO-ID mismatch");
  });

  it("rejette titre paysage pour capture portrait", () => {
    const result = validateVisibleMediaSidecar(
      basePlayerSidecar({
        "OBSERVED-TITLE": "QA C3 — Vidéo réelle paysage",
        "OBSERVED-VIDEO-ID": LANDSCAPE_ID,
        VALID: false,
      }),
      { expectedOrientation: "portrait" },
    );
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("OBSERVED-VIDEO-ID mismatch");
    expect(result.reasons).toContain("title orientation mismatch (expected portrait)");
  });

  it("rejette média masqué ou hors écran", () => {
    const result = validateVisibleMediaSidecar(
      basePlayerSidecar({ VISIBLE: false, "INTERSECTION-RATIO": 0, VALID: false }),
    );
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("media not visible");
    expect(result.reasons).toContain("INTERSECTION-RATIO must be > 0");
  });

  it("rejette sidecar sans SHA256", () => {
    const result = validateVisibleMediaSidecar(
      basePlayerSidecar({ "SCREENSHOT-SHA256": "", VALID: false }),
    );
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("missing SCREENSHOT-SHA256");
  });

  it("rejette carte desktop non entièrement visible", () => {
    const result = validateVisibleMediaSidecar(
      baseDesktopCardSidecar({ "CARD-FULLY-IN-VIEWPORT": false, VALID: false }),
      { mode: "desktop-card" },
    );
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("card not fully in viewport");
  });
});

describe("validateLegacySidecar08 — assertions négatives", () => {
  it("rejette l'ancien sidecar 01 (titre vide, VALID=true)", () => {
    const legacy = {
      SCREENSHOT: "01-real-portrait-mobile-390x844.png",
      "EXPECTED-VIDEO-ID": PORTRAIT_ID,
      OBSERVED_TITLE: "",
      VALID: true,
    };
    const result = validateLegacySidecar08(legacy);
    expect(result.valid).toBe(false);
    expect(result.reasons.some((r) => r.includes("legacy-01"))).toBe(true);
  });

  it("rejette l'ancien sidecar 05 (sans CARD-*, VALID=true)", () => {
    const legacy = {
      SCREENSHOT: "05-real-portrait-desktop-1366x900.png",
      "EXPECTED-VIDEO-ID": PORTRAIT_ID,
      "OBSERVED-TITLE": "QA C3 — Vidéo réelle portrait",
      VALID: true,
    };
    const result = validateLegacySidecar08(legacy);
    expect(result.valid).toBe(false);
    expect(result.reasons.some((r) => r.includes("legacy-05"))).toBe(true);
  });
});
