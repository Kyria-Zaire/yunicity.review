import { describe, expect, it } from "vitest";

import {
  formatContentAuthor,
  formatCreatorContentTypeLabel,
  formatReadingTime,
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
  });
});
