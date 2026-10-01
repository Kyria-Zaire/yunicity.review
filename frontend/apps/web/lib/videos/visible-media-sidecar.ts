export type VisibleMediaSidecar = {
  SCREENSHOT: string;
  "SCREENSHOT-SHA256": string;
  "CAPTURED-AT": string;
  VIEWPORT: string;
  ZOOM: number;
  ROUTE: string;
  "EXPECTED-VIDEO-ID": string;
  "OBSERVED-VIDEO-ID"?: string;
  "OBSERVED-TITLE"?: string;
  "CURRENT-SRC"?: string;
  "VIDEO-WIDTH"?: number;
  "VIDEO-HEIGHT"?: number;
  DURATION?: number;
  "OBJECT-FIT"?: string;
  "OBJECT-POSITION"?: string;
  VISIBLE?: boolean;
  "INTERSECTION-RATIO"?: number;
  "VIDEO-BOUNDS"?: Record<string, number>;
  "CONTAINER-BOUNDS"?: Record<string, number>;
  "CARD-VIDEO-ID"?: string;
  "CARD-TITLE"?: string;
  "CARD-HREF"?: string;
  "MEDIA-IDENTIFIER"?: string;
  "CARD-BOUNDS"?: Record<string, number>;
  "CARD-FULLY-IN-VIEWPORT"?: boolean;
  VALID: boolean;
};

export type ValidateSidecarOptions = {
  expectedOrientation?: "portrait" | "landscape";
  mode?: "player" | "desktop-card";
};

function hasText(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function orientationMatches(title: string, expected: "portrait" | "landscape"): boolean {
  const lower = title.toLowerCase();
  if (expected === "portrait") return lower.includes("portrait");
  return lower.includes("paysage") || lower.includes("landscape");
}

/** Valide un sidecar v10 — rejette titres vides, UUID incorrect, média masqué, SHA absent. */
export function validateVisibleMediaSidecar(
  sidecar: VisibleMediaSidecar,
  options: ValidateSidecarOptions = {},
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const mode = options.mode ?? (sidecar["CURRENT-SRC"] ? "player" : "desktop-card");

  if (!hasText(sidecar["SCREENSHOT-SHA256"])) {
    reasons.push("missing SCREENSHOT-SHA256");
  }
  if (!hasText(sidecar["CAPTURED-AT"])) {
    reasons.push("missing CAPTURED-AT");
  }
  if (!hasText(sidecar["EXPECTED-VIDEO-ID"])) {
    reasons.push("missing EXPECTED-VIDEO-ID");
  }

  if (mode === "player") {
    if (!hasText(sidecar["OBSERVED-TITLE"])) {
      reasons.push("empty OBSERVED-TITLE");
    }
    if (sidecar["OBSERVED-VIDEO-ID"] !== sidecar["EXPECTED-VIDEO-ID"]) {
      reasons.push("OBSERVED-VIDEO-ID mismatch");
    }
    if (sidecar.VISIBLE !== true) {
      reasons.push("media not visible");
    }
    if ((sidecar["INTERSECTION-RATIO"] ?? 0) <= 0) {
      reasons.push("INTERSECTION-RATIO must be > 0");
    }
    if (!hasText(sidecar["CURRENT-SRC"])) {
      reasons.push("missing CURRENT-SRC");
    }
  } else {
    if (!hasText(sidecar["CARD-TITLE"])) {
      reasons.push("empty CARD-TITLE");
    }
    if (sidecar["CARD-VIDEO-ID"] !== sidecar["EXPECTED-VIDEO-ID"]) {
      reasons.push("CARD-VIDEO-ID mismatch");
    }
    if (sidecar["CARD-FULLY-IN-VIEWPORT"] !== true) {
      reasons.push("card not fully in viewport");
    }
    if (!hasText(sidecar["CARD-HREF"] ?? sidecar["MEDIA-IDENTIFIER"])) {
      reasons.push("missing CARD-HREF or MEDIA-IDENTIFIER");
    }
  }

  if (options.expectedOrientation) {
    const title =
      mode === "player" ? sidecar["OBSERVED-TITLE"] ?? "" : sidecar["CARD-TITLE"] ?? "";
    if (!orientationMatches(title, options.expectedOrientation)) {
      reasons.push(`title orientation mismatch (expected ${options.expectedOrientation})`);
    }
  }

  const computedValid = reasons.length === 0;
  if (sidecar.VALID !== computedValid) {
    reasons.push(`VALID flag inconsistent (declared=${sidecar.VALID}, computed=${computedValid})`);
  }

  return { valid: computedValid && sidecar.VALID === true, reasons };
}

/** Rejette explicitement les anciens sidecars 01/05 de la passe 08. */
export function validateLegacySidecar08(sidecar: Record<string, unknown>): {
  valid: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const screenshot = String(sidecar.SCREENSHOT ?? "");

  if (screenshot.startsWith("01-real-portrait-mobile")) {
    if (!hasText(String(sidecar.OBSERVED_TITLE ?? ""))) {
      reasons.push("legacy-01: empty OBSERVED_TITLE");
    }
    if (sidecar.VALID === true) {
      reasons.push("legacy-01: VALID must be false without visible title proof");
    }
  }

  if (screenshot.startsWith("05-real-portrait-desktop")) {
    if (!hasText(String(sidecar["CURRENT-SRC"] ?? "")) && !hasText(String(sidecar["CARD-VIDEO-ID"] ?? ""))) {
      reasons.push("legacy-05: missing player or card media proof");
    }
    if (sidecar.VALID === true) {
      reasons.push("legacy-05: VALID must be false for card without CARD-* contract");
    }
  }

  return { valid: reasons.length === 0, reasons };
}
