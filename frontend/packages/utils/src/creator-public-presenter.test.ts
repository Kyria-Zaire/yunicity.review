import { describe, expect, it } from "vitest";

import {
  CREATOR_DETAIL_EMPTY_BODY,
  CREATOR_DETAIL_ERROR,
  CREATOR_DETAIL_NOT_FOUND,
  formatContentAuthor,
  formatCreatorContentBody,
  formatCreatorContentDate,
  formatCreatorContentErrorMessage,
  formatCreatorContentNotFoundMessage,
  formatCreatorContentType,
  formatCreatorContentTypeLabel,
  formatReadingTime,
  getCreatorContentDetailBackHref,
  getCreatorContentDetailHref,
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
});
