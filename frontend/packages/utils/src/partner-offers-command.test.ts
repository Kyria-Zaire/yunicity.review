import { describe, expect, it } from "vitest";

import type { PartnerOfferAdminSummaryResponse } from "@yunicity/types";

import {
  buildPartnerOffersCatalogKpiCards,
  buildPartnerOffersCatalogMomentum,
  buildPartnerOffersCatalogNextAction,
  buildPartnerOffersCatalogSignal,
  buildPartnerOffersConseilMessage,
  buildPartnerOffersMetricsFromSummary,
  partnerOffersCatalogMomentumMicrocopy,
  passportOffersHasActiveFilters,
} from "./partner-offers-command";

function summary(
  overrides: Partial<PartnerOfferAdminSummaryResponse> = {},
): PartnerOfferAdminSummaryResponse {
  return {
    city: "Reims",
    generated_at: "2026-06-01T10:00:00Z",
    total: 0,
    pending_review: 0,
    published: 0,
    draft: 0,
    rejected: 0,
    archived: 0,
    contributor_partners: 0,
    expired_or_inactive: 0,
    ...overrides,
  };
}

describe("buildPartnerOffersCatalogSignal", () => {
  it("priorise les offres en attente", () => {
    const signal = buildPartnerOffersCatalogSignal(
      buildPartnerOffersMetricsFromSummary(summary({ total: 3, pending_review: 2 })),
    );
    expect(signal.type).toBe("pending");
    expect(signal.description).toContain("2");
  });

  it("signale un catalogue vide", () => {
    const signal = buildPartnerOffersCatalogSignal(
      buildPartnerOffersMetricsFromSummary(summary()),
    );
    expect(signal.type).toBe("empty");
  });
});

describe("buildPartnerOffersCatalogNextAction", () => {
  it("propose la création sans offre", () => {
    const action = buildPartnerOffersCatalogNextAction(
      buildPartnerOffersMetricsFromSummary(summary()),
    );
    expect(action.href).toBe("/passport-offers/new");
  });
});

describe("buildPartnerOffersCatalogKpiCards", () => {
  it("retourne 5 KPI narratifs", () => {
    const cards = buildPartnerOffersCatalogKpiCards(
      buildPartnerOffersMetricsFromSummary(summary({ total: 5, published: 2 })),
    );
    expect(cards).toHaveLength(5);
    expect(cards[0]?.value).toBe(5);
  });
});

describe("buildPartnerOffersCatalogMomentum", () => {
  it("calcule la progression pilote", () => {
    const momentum = buildPartnerOffersCatalogMomentum(
      buildPartnerOffersMetricsFromSummary(summary({ published: 4 })),
    );
    expect(momentum.progressPercent).toBe(40);
    expect(partnerOffersCatalogMomentumMicrocopy(4)).toContain("attractif");
  });
});

describe("buildPartnerOffersConseilMessage", () => {
  it("vise l'objectif pilote", () => {
    const message = buildPartnerOffersConseilMessage(
      buildPartnerOffersMetricsFromSummary(summary({ total: 3, published: 2 })),
    );
    expect(message).toContain("10 offres");
  });
});

describe("passportOffersHasActiveFilters", () => {
  it("détecte une recherche active", () => {
    expect(
      passportOffersHasActiveFilters({
        status: "",
        organizationId: "",
        offerType: "",
        q: "café",
      }),
    ).toBe(true);
  });
});
