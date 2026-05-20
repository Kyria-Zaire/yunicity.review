import { describe, expect, it } from "vitest";

import {
  NEIGHBORHOOD_DISCOVER_CTA,
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_PAGE_SUBTITLE,
  NEIGHBORHOODS_PAGE_TITLE,
  formatTerritorialLine,
  neighborhoodAmbianceLine,
  neighborhoodHref,
} from "./neighborhood-labels";

const FORBIDDEN_COPY = /trending|top quartier|most active|🔥/i;

describe("neighborhood labels", () => {
  it("exposes calm editorial page title", () => {
    expect(NEIGHBORHOODS_PAGE_TITLE).toBe("Quartiers");
    expect(NEIGHBORHOODS_PAGE_TITLE.toLowerCase()).not.toContain("trending");
  });

  it("formats territorial line as quartier · ville", () => {
    expect(
      formatTerritorialLine({ slug: "boulingrin", display_name: "Boulingrin" }, "Reims"),
    ).toBe("Boulingrin · Reims");
  });

  it("falls back to district when no summary", () => {
    expect(formatTerritorialLine(null, "Reims", "Centre-ville")).toBe("Centre-ville · Reims");
  });

  it("builds neighborhood href with city query", () => {
    expect(neighborhoodHref("saint-remi", "Reims")).toBe(
      "/neighborhoods/saint-remi?city=Reims",
    );
  });

  it("ambiance line is editorial not competitive", () => {
    const line = neighborhoodAmbianceLine("cultural");
    expect(line).toContain("culturelle");
    expect(line).not.toMatch(/top|trending|#\d/i);
  });

  it("public copy avoids tribal or hype micro-copy", () => {
    for (const text of [
      NEIGHBORHOODS_PAGE_TITLE,
      NEIGHBORHOODS_PAGE_SUBTITLE,
      NEIGHBORHOODS_EMPTY,
      NEIGHBORHOOD_DISCOVER_CTA,
    ]) {
      expect(text).not.toMatch(FORBIDDEN_COPY);
    }
  });

  it("badge href targets neighborhood detail with city", () => {
    const href = neighborhoodHref("saint-remi", "Reims");
    expect(href).toContain("/neighborhoods/saint-remi");
    expect(href).toContain("city=Reims");
  });
});
