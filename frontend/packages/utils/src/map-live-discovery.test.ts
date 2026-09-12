import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
} from "@yunicity/types";
import { describe, expect, it } from "vitest";

import { buildMapLiveDiscoveryItems } from "./map-live-discovery";

const BASE_EVENT: LocalEvent = {
  id: "event-1",
  organization_id: null,
  title: "Jazz Session",
  description: null,
  event_type: "concert",
  city: "Reims",
  district: null,
  starts_at: "2026-06-01T18:00:00Z",
  ends_at: null,
  timezone: "Europe/Paris",
  location_name: "Place d'Erlon",
  address: null,
  latitude: 49.25,
  longitude: 4.03,
  cover_image_url: "https://img.example/jazz.jpg",
  moderation_status: "approved",
  is_cancelled: false,
  interested_by_me: false,
  organization: null,
  neighborhood_summary: null,
  created_at: "2026-05-01T00:00:00Z",
};

const BASE_PLACE: CulturalPlaceListItem = {
  id: "place-1",
  slug: "palais-du-tau",
  name: "Palais du Tau",
  short_description: "Lieu patrimonial",
  city: "Reims",
  address: "2 Place du Cardinal Lucon",
  category: "museum",
  latitude: 49.25,
  longitude: 4.03,
  image_alt: null,
  source_name: "seed",
  image_credit: null,
  neighborhood: null,
  image_url: "https://img.example/place.jpg",
  hero_image_url: "https://img.example/place-hero.jpg",
  thumbnail_image_url: "https://img.example/place-thumb.jpg",
  gallery_images: [],
  editorial_excerpt: "A decouvrir",
  photo_credit: null,
  image_source: null,
};

const BASE_OFFER = {
  id: "offer-1",
  slug: "cafe-offert",
  title: "Cafe offert",
  description: null,
  value_label: null,
  offer_type: "drink" as const,
  conditions: null,
  tier_code_required: null,
  valid_from: "2026-05-01T00:00:00Z",
  valid_until: "2026-06-02T00:00:00Z",
  is_featured: false,
  partner: {
    name: "Cafe du Centre",
    slug: "cafe-du-centre",
    logo_url: "https://img.example/logo.jpg",
    cover_image_url: null,
    category: null,
    city: "Reims",
    is_verified: true,
    partner_status: "active" as const,
  },
};

const BASE_NEIGHBORHOOD: Neighborhood = {
  id: "hood-1",
  city: "Reims",
  slug: "centre-ville",
  display_name: "Centre-ville",
  short_description: "Toujours vivant en soiree",
  ambiance: null,
  cover_image_url: "https://img.example/hood.jpg",
  accent_color: null,
  latitude: null,
  longitude: null,
  radius_meters: null,
  is_featured: true,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("buildMapLiveDiscoveryItems", () => {
  it("builds mixed local discovery rail with real sources", () => {
    const items = buildMapLiveDiscoveryItems({
      city: "Reims",
      events: [BASE_EVENT],
      culturalPlaces: [BASE_PLACE],
      passportOffers: [BASE_OFFER],
      neighborhoods: [BASE_NEIGHBORHOOD],
      now: new Date("2026-05-31T10:00:00Z"),
    });

    expect(items).toHaveLength(4);
    expect(items.map((item) => item.kind)).toEqual([
      "event",
      "passport",
      "neighborhood",
      "culture",
    ]);
    expect(items[0]?.href).toContain("/map?event=event-1");
    expect(items[0]?.secondaryHref).toBe("/events/event-1");
  });

  it("returns empty when no source has data", () => {
    const items = buildMapLiveDiscoveryItems({
      city: "Reims",
      events: [],
      culturalPlaces: [],
      passportOffers: [],
      neighborhoods: [],
    });
    expect(items).toEqual([]);
  });
});
