import { describe, expect, it } from "vitest";

import { eventReadiness, territoryEventHealth } from "./event-readiness";

describe("eventReadiness", () => {
  const base = {
    title: "Marché bio du samedi",
    description:
      "Producteurs locaux, dégustations et animations pour toute la famille au centre-ville.",
    starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location_name: "Place Drouet d'Erlon",
    visibility: "public",
    moderation_status: "approved",
    is_cancelled: false,
  };

  it("marks a complete upcoming event as ready", () => {
    const result = eventReadiness(base);
    expect(result.readiness).toBe("ready");
    expect(result.contributes_to_territory).toBe(true);
  });

  it("marks pilot placeholder as not ready", () => {
    const result = eventReadiness({
      ...base,
      title: "Afterwork découverte",
      description: "Un moment pilote proposé dans le cadre du réseau partenaire Yunicity.",
    });
    expect(result.readiness).toBe("not_ready");
    expect(result.classification).toBe("placeholder");
  });
});

describe("territoryEventHealth", () => {
  it("returns healthy when 5 or more upcoming events", () => {
    expect(territoryEventHealth(5).status).toBe("healthy");
  });

  it("returns warning for 1-4 upcoming events", () => {
    expect(territoryEventHealth(2).status).toBe("warning");
  });

  it("returns critical for zero upcoming events", () => {
    expect(territoryEventHealth(0).status).toBe("critical");
  });
});
