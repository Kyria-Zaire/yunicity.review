import { describe, expect, it } from "vitest";

import { AuthError } from "./auth/auth-errors";
import {
  challengeClaimButtonLabel,
  formatChallengeProgressPercent,
  formatPassportTierLabel,
  humanizeChallengeClaimError,
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
