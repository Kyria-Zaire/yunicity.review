import { describe, expect, it } from "vitest";

import type { NeighborhoodDetailContributionItem } from "@yunicity/types";

import { AuthError } from "./auth/auth-errors";
import {
  NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH,
  NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH,
  NEIGHBORHOOD_V2_CONTRIBUTION_EMPTY_LINE_1,
  NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE,
  buildContributionCardSections,
  contributionHasVisibleTitle,
  createInitialContributionFormState,
  formatContributionCharacterCount,
  formatNeighborhoodContributionDate,
  isContributionFormValid,
  mapContributionSubmitError,
  selectApprovedContributionsForDisplay,
  shouldShowContributionSeeMore,
  validateContributionBody,
} from "./neighborhood-contribution-presenter";

const SAMPLE_ITEM: NeighborhoodDetailContributionItem = {
  id: "c1",
  title: "Notre rituel",
  body: "Les halles du samedi matin, c'est notre rendez-vous en famille depuis des années.",
  author_label: "Camille R.",
  passport_verified_snapshot: false,
  approved_at: "2026-06-11T10:00:00.000Z",
  created_at: "2026-06-10T10:00:00.000Z",
};

describe("neighborhood-contribution-presenter", () => {
  it("keeps empty state copy visible in constants", () => {
    expect(NEIGHBORHOOD_V2_CONTRIBUTION_EMPTY_LINE_1).toContain("Aucun souvenir");
  });

  it("builds body-first card sections with identity before body", () => {
    const sections = buildContributionCardSections(SAMPLE_ITEM, new Date("2026-06-13T10:00:00Z"));
    expect(sections.identity).toBe("Camille R.");
    expect(sections.title).toBe("Notre rituel");
    expect(sections.body).toContain("halles du samedi");
    expect(sections.dateLabel).toBe("Il y a 2 jours");
  });

  it("hides title when null or blank", () => {
    const withoutTitle = buildContributionCardSections({
      ...SAMPLE_ITEM,
      title: null,
    });
    expect(withoutTitle.title).toBeNull();
    expect(contributionHasVisibleTitle(null)).toBe(false);
    expect(contributionHasVisibleTitle("   ")).toBe(false);
  });

  it("rejects body shorter than 40 characters", () => {
    expect(validateContributionBody("trop court")).toBe(false);
    expect(
      validateContributionBody("a".repeat(NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH)),
    ).toBe(true);
  });

  it("rejects body longer than 800 characters", () => {
    expect(validateContributionBody("a".repeat(NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH + 1))).toBe(
      false,
    );
    expect(validateContributionBody("a".repeat(NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH))).toBe(
      true,
    );
  });

  it("formats character counter", () => {
    expect(formatContributionCharacterCount(143, 800)).toBe("143 / 800");
  });

  it("maps API business errors to French copy", () => {
    expect(
      mapContributionSubmitError(
        new AuthError("CONTRIBUTION_PENDING_EXISTS", "pending", 409),
      ),
    ).toContain("en attente");
    expect(
      mapContributionSubmitError(new AuthError("CONTRIBUTION_QUOTA_EXCEEDED", "quota", 409)),
    ).toContain("récemment");
    expect(
      mapContributionSubmitError(
        new AuthError("CONTRIBUTION_VERIFIED_IDENTITY_UNAVAILABLE", "verified", 422),
      ),
    ).toContain("Passport actif");
    expect(mapContributionSubmitError(new AuthError("UNAUTHORIZED", "auth", 401))).toContain(
      "Connectez-vous",
    );
  });

  it("resets form state after success via initial factory", () => {
    const dirty = {
      identityType: "VERIFIED" as const,
      title: "Un titre",
      body: "a".repeat(NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH),
    };
    expect(isContributionFormValid(dirty)).toBe(true);
    const reset = createInitialContributionFormState();
    expect(reset).toEqual({ identityType: "PSEUDO", title: "", body: "" });
    expect(isContributionFormValid(reset)).toBe(false);
    expect(NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE).toContain("relu");
  });

  it("limits displayed contributions to three and flags see-more", () => {
    const items = Array.from({ length: 5 }, (_, index) => ({
      ...SAMPLE_ITEM,
      id: `c${index}`,
    }));
    expect(selectApprovedContributionsForDisplay(items)).toHaveLength(3);
    expect(shouldShowContributionSeeMore(4)).toBe(true);
    expect(shouldShowContributionSeeMore(3)).toBe(false);
  });

  it("formats older contribution dates as month labels", () => {
    expect(
      formatNeighborhoodContributionDate("2025-03-15T10:00:00.000Z", new Date("2026-06-13T10:00:00Z")),
    ).toBe("Mars 2025");
  });
});
