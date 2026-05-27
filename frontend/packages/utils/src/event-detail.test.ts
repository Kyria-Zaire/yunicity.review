import { describe, expect, it } from "vitest";

import type { CulturalPlaceListItem, LocalEvent, Neighborhood } from "@yunicity/types";

import {
  buildEventPracticalRows,
  eventsShareSameWeek,
  eventWeekStartKey,
  pickNearbyCulturalPlaces,
  pickRelatedEvents,
  resolveEventNeighborhoodContext,
} from "./event-detail";

function baseEvent(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "current",
    organization_id: null,
    title: "Moment",
    description: null,
    event_type: "local_concert",
    city: "Reims",
    district: "Centre",
    starts_at: "2026-05-27T19:00:00.000Z",
    ends_at: "2026-05-27T21:00:00.000Z",
    timezone: "Europe/Paris",
    location_name: "Opéra",
    address: "1 place",
    latitude: 49.25,
    longitude: 4.03,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    organization: null,
    neighborhood_summary: { slug: "centre", display_name: "Centre-ville" },
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("event-detail", () => {
  it("pickRelatedEvents priorise quartier, type et semaine", () => {
    const current = baseEvent({ id: "current" });
    const sameHood = baseEvent({
      id: "hood",
      title: "A",
      neighborhood_summary: { slug: "centre", display_name: "Centre-ville" },
    });
    const other = baseEvent({
      id: "other",
      title: "B",
      event_type: "workshop",
      neighborhood_summary: { slug: "boulingrin", display_name: "Boulingrin" },
      starts_at: "2026-06-10T19:00:00.000Z",
    });
    const related = pickRelatedEvents(current, [other, sameHood]);
    expect(related.map((e) => e.id)).toEqual(["hood"]);
  });

  it("pickNearbyCulturalPlaces trie par distance quand coords event", () => {
    const event = baseEvent({ latitude: 49.26, longitude: 4.04 });
    const near: CulturalPlaceListItem = {
      id: "1",
      slug: "near",
      name: "Proche",
      city: "Reims",
      short_description: "Lieu",
      address: "Rue A",
      category: "monument",
      editorial_excerpt: null,
      image_url: null,
      hero_image_url: null,
      thumbnail_image_url: null,
      gallery_images: [],
      photo_credit: null,
      image_source: null,
      image_alt: null,
      source_name: "seed",
      image_credit: null,
      neighborhood: null,
      latitude: 49.2601,
      longitude: 4.0401,
    };
    const far: CulturalPlaceListItem = {
      ...near,
      id: "2",
      slug: "far",
      name: "Loin",
      latitude: 49.1,
      longitude: 3.9,
    };
    expect(pickNearbyCulturalPlaces(event, [far, near]).map((p) => p.slug)).toEqual(["near", "far"]);
  });

  it("resolveEventNeighborhoodContext expose slug et ligne éditoriale", () => {
    const hoods: Neighborhood[] = [
      {
        id: "h1",
        city: "Reims",
        slug: "centre",
        display_name: "Centre-ville",
        short_description: "Cœur historique.",
        ambiance: "cultural",
        cover_image_url: null,
        accent_color: null,
        latitude: null,
        longitude: null,
        radius_meters: null,
        is_featured: true,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ];
    const ctx = resolveEventNeighborhoodContext(baseEvent(), hoods);
    expect(ctx?.slug).toBe("centre");
    expect(ctx?.editorialLine).toContain("Cœur historique");
    expect(ctx?.neighborhoodHref).toContain("/neighborhoods/centre");
  });

  it("eventsShareSameWeek compare le lundi de semaine locale", () => {
    expect(eventsShareSameWeek("2026-05-27T10:00:00.000Z", "2026-05-29T10:00:00.000Z")).toBe(true);
    expect(eventsShareSameWeek("2026-05-27T10:00:00.000Z", "2026-06-03T10:00:00.000Z")).toBe(false);
    expect(eventWeekStartKey("2026-05-27T10:00:00.000Z")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("buildEventPracticalRows inclut tarif et catégorie", () => {
    const rows = buildEventPracticalRows(baseEvent(), "Concert local");
    expect(rows.some((r) => r.label === "Tarif" && r.value.includes("libre"))).toBe(true);
    expect(rows.some((r) => r.label === "Catégorie" && r.value === "Concert local")).toBe(true);
  });
});
