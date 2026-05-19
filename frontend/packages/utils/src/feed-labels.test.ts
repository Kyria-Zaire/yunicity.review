import { describe, expect, it } from "vitest";

import {
  FEED_EMPTY_TITLE,
  FEED_REPORT_REASON_LABELS,
  authorInitials,
  formatFeedDate,
  formatOfferValidUntil,
} from "./feed-labels";

describe("FEED_REPORT_REASON_LABELS", () => {
  it("expose les libellés français MVP", () => {
    expect(FEED_REPORT_REASON_LABELS.spam).toBe("Spam");
    expect(FEED_REPORT_REASON_LABELS.inappropriate).toContain("inapproprié");
    expect(FEED_REPORT_REASON_LABELS.other).toBe("Autre");
  });
});

describe("authorInitials", () => {
  it("retourne deux lettres pour un nom composé", () => {
    expect(authorInitials("Marie Dupont")).toBe("MD");
  });

  it("retourne un fallback pour un nom vide", () => {
    expect(authorInitials("  ")).toBe("?");
  });
});

describe("formatFeedDate", () => {
  it("formate une date ISO valide", () => {
    expect(formatFeedDate("2026-05-19T12:00:00.000Z")).toMatch(/\d/);
  });

  it("retourne une chaîne vide si invalide", () => {
    expect(formatFeedDate("not-a-date")).toBe("");
  });
});

describe("formatOfferValidUntil", () => {
  it("indique une offre expirée", () => {
    expect(formatOfferValidUntil("2020-01-01T00:00:00.000Z")).toBe("Expirée");
  });

  it("retourne null sans date", () => {
    expect(formatOfferValidUntil(null)).toBeNull();
  });
});

describe("FEED_EMPTY_TITLE", () => {
  it("reste chaleureux et local", () => {
    expect(FEED_EMPTY_TITLE.toLowerCase()).toContain("ville");
  });
});
