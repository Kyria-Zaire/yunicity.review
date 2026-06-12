import { describe, expect, it } from "vitest";

import { AuthError } from "./auth/auth-errors";
import {
  challengeClaimButtonLabel,
  formatChallengeProgressPercent,
  formatClaimSuccessBanner,
  formatPassportTierHumanSubtitle,
  formatPassportTierLabel,
  getChallengeMotivationMessage,
  getPassportHeroContextMessage,
  getReputationContextMessage,
  getWalletContextMessage,
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

describe("getPassportHeroContextMessage", () => {
  it("prioritizes suspended status", () => {
    expect(
      getPassportHeroContextMessage({
        passportStatus: "suspended",
        passportTier: "gold",
        earnedBadges: 10,
      }),
    ).toContain("indisponible");
  });

  it("uses gold tier message before badge milestones", () => {
    expect(
      getPassportHeroContextMessage({
        passportStatus: "active",
        passportTier: "gold",
        earnedBadges: 0,
      }),
    ).toContain("inspires");
  });

  it("maps badge milestones", () => {
    expect(
      getPassportHeroContextMessage({
        passportStatus: "active",
        passportTier: "basic",
        earnedBadges: 0,
      }),
    ).toContain("Chaque action");
  });
});

describe("formatPassportTierHumanSubtitle", () => {
  it("maps silver tier", () => {
    expect(formatPassportTierHumanSubtitle("silver")).toBe("Citoyen engagé");
  });
});

describe("getChallengeMotivationMessage", () => {
  it("celebrates completion", () => {
    expect(getChallengeMotivationMessage(5, 5, true)).toBe("Défi terminé 🎉");
  });

  it("nudges when one action remains", () => {
    expect(getChallengeMotivationMessage(4, 5, false)).toBe("Plus qu'une action pour réussir.");
  });
});

describe("formatClaimSuccessBanner", () => {
  it("formats ym reward", () => {
    expect(
      formatClaimSuccessBanner({
        claimed: true,
        ym_awarded: 12,
        message: "Récompense réclamée avec succès.",
      }),
    ).toBe("+12 YM ajoutés à ton portefeuille.");
  });
});

describe("getWalletContextMessage", () => {
  it("encourages first earners", () => {
    expect(getWalletContextMessage({ balance: 0, lifetime_earned: 0 })).toContain(
      "premières actions",
    );
  });
});

describe("getReputationContextMessage", () => {
  it("celebrates high reputation", () => {
    expect(getReputationContextMessage(150)).toContain("plus engagés");
  });
});

describe("humanizeChallengeClaimError", () => {
  it("maps wallet suspended", () => {
    const err = new AuthError("YUNI_WALLET_SUSPENDED", "suspendu", 403);
    expect(humanizeChallengeClaimError(err, "fallback")).toContain("temporairement indisponible");
  });

  it("maps challenge not completed", () => {
    const err = new AuthError("PASSPORT_CHALLENGE_NOT_COMPLETED", "pas fini", 400);
    expect(humanizeChallengeClaimError(err, "fallback")).toContain("Termine ce défi");
  });

  it("maps network failures", () => {
    expect(humanizeChallengeClaimError(new Error("network"), "fallback")).toContain(
      "Impossible de contacter Yunicity",
    );
  });
});
