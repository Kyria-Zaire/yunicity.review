import { describe, expect, it } from "vitest";

import {
  FEED_MEDIUM_FILTER_CRITERION_IDS,
  countFeedMediumActiveFilterCriteria,
  isFeedMediumInterestFilterActive,
  resetFeedMediumFilterActivation,
} from "./feed-medium-filter-contract";

describe("C3-FEED-M10 — contrat filtre medium", () => {
  it("expose un seul critère autoritaire", () => {
    expect(FEED_MEDIUM_FILTER_CRITERION_IDS).toEqual(["profile-interests"]);
  });

  it("détecte l'activation seulement avec intérêts", () => {
    expect(
      isFeedMediumInterestFilterActive({ activated: true, interests: ["culture"] }),
    ).toBe(true);
    expect(isFeedMediumInterestFilterActive({ activated: true, interests: [] })).toBe(false);
    expect(
      isFeedMediumInterestFilterActive({ activated: false, interests: ["culture"] }),
    ).toBe(false);
  });

  it("compte 0 ou 1 critère, jamais le nombre d'intérêts", () => {
    expect(
      countFeedMediumActiveFilterCriteria({
        activated: true,
        interests: ["culture", "music"],
      }),
    ).toBe(1);
    expect(countFeedMediumActiveFilterCriteria({ activated: false, interests: ["culture"] })).toBe(
      0,
    );
  });

  it("réinitialise en désactivant", () => {
    expect(resetFeedMediumFilterActivation()).toBe(false);
  });
});
