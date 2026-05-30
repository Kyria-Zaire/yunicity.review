import { describe, expect, it } from "vitest";

import type { LocalEvent } from "@yunicity/types";

import {
  formatEventDateBadge,
  formatEventInterestSocialLine,
  resolveEventVenuePlace,
} from "./event-detail-portal";

const baseEvent: LocalEvent = {
  id: "e1",
  organization_id: null,
  title: "Concert",
  description: null,
  event_type: "concert",
  city: "Reims",
  district: null,
  starts_at: "2026-05-24T18:00:00.000Z",
  ends_at: null,
  timezone: "Europe/Paris",
  location_name: "Café du Forum",
  address: "1 place du Forum",
  latitude: 49.25,
  longitude: 4.03,
  cover_image_url: null,
  moderation_status: "approved",
  is_cancelled: false,
  interested_by_me: false,
  interest_count: 3,
  organization: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("event-detail-portal", () => {
  it("formats date badge parts", () => {
    const badge = formatEventDateBadge("2026-05-24T18:00:00.000Z");
    expect(badge?.day).toBeTruthy();
    expect(badge?.month).toBeTruthy();
  });

  it("formats interest social line", () => {
    expect(formatEventInterestSocialLine(0, false)).toBeNull();
    expect(formatEventInterestSocialLine(2, false)).toContain("2 personnes");
    expect(formatEventInterestSocialLine(2, true)).toContain("vous y participez");
  });

  it("matches venue by location name", () => {
    const place = resolveEventVenuePlace(baseEvent, [
      {
        id: "p1",
        slug: "cafe-du-forum",
        name: "Café du Forum",
        short_description: "Terrasse",
        city: "Reims",
        address: "Forum",
        category: "cafe",
        latitude: 49.25,
        longitude: 4.03,
        image_url: null,
        hero_image_url: null,
        thumbnail_image_url: null,
        gallery_images: [],
        editorial_excerpt: null,
        photo_credit: null,
        image_source: null,
        image_alt: null,
        source_name: "Yunicity",
        image_credit: null,
        neighborhood: null,
      },
    ]);
    expect(place?.slug).toBe("cafe-du-forum");
  });
});
