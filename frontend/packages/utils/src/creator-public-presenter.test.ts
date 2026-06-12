import { describe, expect, it } from "vitest";

import {
  CREATOR_DETAIL_EMPTY_BODY,
  CREATOR_DETAIL_ERROR,
  CREATOR_DETAIL_NOT_FOUND,
  buildCreatorProfileHref,
  formatContentAuthor,
  formatCreatorContentBody,
  formatCreatorContentDate,
  formatCreatorContentErrorMessage,
  formatCreatorContentNotFoundMessage,
  formatCreatorContentType,
  formatCreatorContentTypeLabel,
  formatCreatorDirectoryItem,
  formatCreatorPublishedCountLabel,
  formatCreatorTerritoryLabel,
  formatReadingTime,
  getCreatorContentDetailBackHref,
  getCreatorContentDetailHref,
  getCreatorDirectoryHref,
} from "./creator-public-presenter";

describe("creator-public-presenter", () => {
  it("formats partner author label", () => {
    expect(
      formatContentAuthor({
        kind: "partner",
        organization_id: "org-1",
        display_name: "Café du Centre",
        slug: "cafe-du-centre",
      }),
    ).toBe("Café du Centre");
  });

  it("falls back to partner label when name empty", () => {
    expect(
      formatContentAuthor({
        kind: "partner",
        organization_id: "org-1",
        display_name: "  ",
        slug: "cafe",
      }),
    ).toBe("Partenaire local");
  });

  it("formats future creator_profile author", () => {
    expect(
      formatContentAuthor({
        kind: "creator_profile",
        organization_id: "org-1",
        display_name: "Léa Martin",
        slug: "lea-martin",
      }),
    ).toBe("Léa Martin");
  });

  it("formats reading time", () => {
    expect(formatReadingTime(null)).toBe("1 min");
    expect(formatReadingTime("mot")).toBe("1 min");
    expect(formatReadingTime(new Array(250).fill("mot").join(" "))).toBe("2 min");
  });

  it("formats content type label", () => {
    expect(formatCreatorContentTypeLabel("article")).toBe("Article");
    expect(formatCreatorContentTypeLabel("photo")).toBe("Photo");
    expect(formatCreatorContentType("photo")).toBe("Photo");
  });

  it("formats content date in French locale", () => {
    const label = formatCreatorContentDate("2026-03-15T12:00:00.000Z");
    expect(label).toContain("2026");
    expect(label.length).toBeGreaterThan(0);
  });

  it("splits body into paragraphs and detects empty body", () => {
    expect(formatCreatorContentBody(null)).toEqual({ paragraphs: [], isEmpty: true });
    expect(formatCreatorContentBody("   ")).toEqual({ paragraphs: [], isEmpty: true });
    expect(formatCreatorContentBody("Un seul bloc.")).toEqual({
      paragraphs: ["Un seul bloc."],
      isEmpty: false,
    });
    expect(formatCreatorContentBody("Premier.\n\nDeuxième.")).toEqual({
      paragraphs: ["Premier.", "Deuxième."],
      isEmpty: false,
    });
  });

  it("exposes detail navigation and messages", () => {
    expect(getCreatorContentDetailBackHref()).toBe("/creator-content");
    expect(getCreatorContentDetailHref("abc-123")).toBe("/creator-content/abc-123");
    expect(formatCreatorContentNotFoundMessage()).toBe(CREATOR_DETAIL_NOT_FOUND);
    expect(formatCreatorContentErrorMessage()).toBe(CREATOR_DETAIL_ERROR);
    expect(CREATOR_DETAIL_EMPTY_BODY).toContain("texte détaillé");
  });

  it("formats directory item and helpers", () => {
    const view = formatCreatorDirectoryItem({
      id: "creator-1",
      kind: "partner",
      display_name: "Studio Lumière",
      slug: "studio-lumiere",
      description: "Un regard local sur le territoire.",
      logo_url: "https://cdn.example.com/logo.png",
      territory: { city: "Reims", neighborhood_name: "Centre-ville" },
      partnership_type: "creator_partner",
      partner_status: "active",
      published_content_count: 3,
    });
    expect(view.displayName).toBe("Studio Lumière");
    expect(view.territoryLabel).toBe("Centre-ville · Reims");
    expect(view.publishedCountLabel).toBe("3 histoires publiées");
    expect(view.badgeLabel).toBe("Créateur partenaire");
    expect(buildCreatorProfileHref("creator-1")).toBe("/creators/creator-1");
    expect(getCreatorDirectoryHref()).toBe("/creators");
    expect(formatCreatorTerritoryLabel({ city: "Reims", neighborhood_name: null })).toBe("Reims");
    expect(formatCreatorPublishedCountLabel(1)).toBe("1 histoire publiée");
  });
});
