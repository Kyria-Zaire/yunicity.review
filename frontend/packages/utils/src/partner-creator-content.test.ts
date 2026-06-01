import { describe, expect, it } from "vitest";

import {
  formatPartnerCreatorContentExcerpt,
  formatPartnerCreatorContentPublishedAt,
  hasPartnerCreatorContentMedia,
} from "./partner-creator-content";

describe("formatPartnerCreatorContentExcerpt", () => {
  it("truncates long body with ellipsis", () => {
    const body = "a".repeat(200);
    expect(formatPartnerCreatorContentExcerpt(body, 20)).toBe(`${"a".repeat(19)}…`);
  });

  it("returns empty for blank body", () => {
    expect(formatPartnerCreatorContentExcerpt("   ")).toBe("");
  });
});

describe("hasPartnerCreatorContentMedia", () => {
  it("detects media_url", () => {
    expect(hasPartnerCreatorContentMedia({ media_url: "https://x.test/a.jpg" })).toBe(true);
    expect(hasPartnerCreatorContentMedia({ media_url: null })).toBe(false);
  });
});

describe("formatPartnerCreatorContentPublishedAt", () => {
  it("formats valid ISO date in French locale", () => {
    const label = formatPartnerCreatorContentPublishedAt("2026-06-01T12:00:00.000Z");
    expect(label.length).toBeGreaterThan(0);
  });
});
