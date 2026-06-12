import { describe, expect, it } from "vitest";

import { AuthError } from "./auth/auth-errors";
import {
  challengeClaimButtonLabel,
  formatChallengeProgressPercent,
  formatPassportTierLabel,
  humanizeChallengeClaimError,
  humanizePassportMeLoadError,
  isPassportMeApiUnavailableError,
  isSessionExpiredAuthError,
  PASSPORT_SESSION_EXPIRED_MESSAGE,
} from "./passport-me-presenter";

describe("formatChallengeProgressPercent", () => {
  it("returns 0 when target is zero", () => {
    expect(formatChallengeProgressPercent(3, 0)).toBe(0);
  });

  it("caps at 100", () => {
    expect(formatChallengeProgressPercent(7, 5)).toBe(100);
  });

  it("rounds progress ratio", () => {
    expect(formatChallengeProgressPercent(2, 5)).toBe(40);
  });
});

describe("formatPassportTierLabel", () => {
  it("maps known tier codes", () => {
    expect(formatPassportTierLabel("silver")).toBe("Silver");
    expect(formatPassportTierLabel("neo_arrivant")).toBe("Néo-arrivant");
  });

  it("falls back for unknown tier", () => {
    expect(formatPassportTierLabel("custom")).toBe("custom");
  });
});

describe("challengeClaimButtonLabel", () => {
  it("includes YM amount when reward is positive", () => {
    expect(challengeClaimButtonLabel(10)).toBe("Réclamer 10 YM");
  });

  it("uses generic label for zero reward", () => {
    expect(challengeClaimButtonLabel(0)).toBe("Réclamer la récompense");
  });
});

describe("isSessionExpiredAuthError", () => {
  it("detects expired session auth errors", () => {
    const err = new AuthError("UNAUTHORIZED", "Session expirée. Veuillez vous reconnecter.", 401);
    expect(isSessionExpiredAuthError(err)).toBe(true);
  });

  it("ignores other 401 errors", () => {
    const err = new AuthError("INVALID_CREDENTIALS", "Identifiants invalides", 401);
    expect(isSessionExpiredAuthError(err)).toBe(false);
  });
});

describe("humanizePassportMeLoadError session", () => {
  it("returns passport session copy", () => {
    const err = new AuthError("UNAUTHORIZED", "Session expirée. Veuillez vous reconnecter.", 401);
    expect(humanizePassportMeLoadError(err, "fallback")).toBe(PASSPORT_SESSION_EXPIRED_MESSAGE);
  });
});

describe("isPassportMeApiUnavailableError", () => {
  it("detects missing FastAPI route 404", () => {
    const err = new AuthError("UNKNOWN_ERROR", "Not Found", 404);
    expect(isPassportMeApiUnavailableError(err)).toBe(true);
  });

  it("ignores passport not active", () => {
    const err = new AuthError("PASSPORT_NOT_ACTIVE", "Aucun Passport actif.", 404);
    expect(isPassportMeApiUnavailableError(err)).toBe(false);
  });
});

describe("humanizePassportMeLoadError", () => {
  it("explains missing passport V2 API", () => {
    const err = new AuthError("UNKNOWN_ERROR", "Not Found", 404);
    expect(humanizePassportMeLoadError(err, "fallback")).toContain("PASSPORT-05A");
  });
});

describe("humanizeChallengeClaimError", () => {
  it("maps wallet suspended", () => {
    const err = new AuthError("YUNI_WALLET_SUSPENDED", "suspendu", 403);
    expect(humanizeChallengeClaimError(err, "fallback")).toContain("suspendu");
  });

  it("maps challenge not completed", () => {
    const err = new AuthError("PASSPORT_CHALLENGE_NOT_COMPLETED", "pas fini", 400);
    expect(humanizeChallengeClaimError(err, "fallback")).toContain("pas encore terminé");
  });
});
