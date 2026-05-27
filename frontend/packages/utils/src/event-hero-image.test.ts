import { describe, expect, it } from "vitest";

import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";

import {
  EVENT_TYPE_FALLBACK_IMAGES,
  resolveEventHeroImage,
  resolveFeaturedCarouselEventImage,
} from "./event-hero-image";

function baseEvent(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "e1",
    organization_id: null,
    title: "Marché du Boulingrin",
    description: null,
    event_type: "market",
    city: "Reims",
    district: null,
    starts_at: "2026-05-27T10:00:00Z",
    ends_at: null,
    timezone: "Europe/Paris",
    location_name: "Boulingrin",
    address: null,
    latitude: 49.25,
    longitude: 4.03,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    organization: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("resolveFeaturedCarouselEventImage", () => {
  it("keeps the market type fallback for carousel cards", () => {
    const url = resolveFeaturedCarouselEventImage(baseEvent());
    expect(url).toBe(EVENT_TYPE_FALLBACK_IMAGES.market);
  });
});

describe("resolveEventHeroImage", () => {
  it("uses the same market fallback as Search hero", () => {
    const url = resolveEventHeroImage(baseEvent(), []);
    expect(url).toBe(EVENT_TYPE_FALLBACK_IMAGES.market);
  });

  it("prefers cover_image_url when present", () => {
    const cover = "https://example.com/cover.jpg";
    const url = resolveEventHeroImage(baseEvent({ cover_image_url: cover }), []);
    expect(url).toBe(cover);
  });
});
