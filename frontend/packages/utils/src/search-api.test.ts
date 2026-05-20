import { describe, expect, it } from "vitest";

import { buildSearchQuery } from "./search-api";

describe("buildSearchQuery", () => {
  it("inclut q et city obligatoires", () => {
    const qs = buildSearchQuery({ q: "café", city: "Reims" });
    expect(qs).toContain("q=caf%C3%A9");
    expect(qs).toContain("city=Reims");
  });

  it("mappe organization vers org", () => {
    const qs = buildSearchQuery({
      q: "bar",
      city: "Reims",
      type: "organization",
    });
    expect(qs).toContain("type=org");
  });

  it("ajoute neighborhood_slug, page et limit quand présents", () => {
    const qs = buildSearchQuery({
      q: "parc",
      city: "Reims",
      neighborhood_slug: "centre",
      page: 2,
      limit: 20,
    });
    expect(qs).toContain("neighborhood_slug=centre");
    expect(qs).toContain("page=2");
    expect(qs).toContain("limit=20");
  });

  it("omet type quand absent", () => {
    const qs = buildSearchQuery({ q: "test", city: "Reims" });
    expect(qs).not.toContain("type=");
  });
});
