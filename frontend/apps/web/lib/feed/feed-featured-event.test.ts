import type { LocalEvent } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import {
  filterEveningEventsExcludingFeatured,
  selectFeedFeaturedEvent,
  shouldHideFeedEveningEventsStrip,
} from "@/lib/feed/feed-featured-event";

function event(partial: Partial<LocalEvent> & Pick<LocalEvent, "id" | "title" | "starts_at">): LocalEvent {
  return {
    organization_id: null,
    description: null,
    event_type: null,
    city: "Reims",
    district: null,
    ends_at: null,
    timezone: "Europe/Paris",
    location_name: "Parc",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    organization: null,
    created_at: "2026-08-28T10:00:00Z",
    ...partial,
  };
}

describe("feed-featured-event", () => {
  const now = new Date("2026-08-28T12:00:00+02:00");

  it("priorise un candidat avec couverture et description", () => {
    const featured = selectFeedFeaturedEvent(
      [
        event({ id: "a", title: "Concert", starts_at: "2026-08-28T19:00:00+02:00" }),
        event({
          id: "b",
          title: "Cinéma en plein air",
          starts_at: "2026-08-28T20:30:00+02:00",
          description: "Projection sous les étoiles.",
          cover_image_url: "https://cdn.example/cinema.jpg",
          interest_count: 18,
        }),
      ],
      now,
    );

    expect(featured?.id).toBe("b");
  });

  it("retire l'événement mis en avant du bandeau soirée", () => {
    const items = [
      event({ id: "a", title: "A", starts_at: "2026-08-28T19:00:00+02:00" }),
      event({ id: "b", title: "B", starts_at: "2026-08-28T20:30:00+02:00" }),
    ];

    expect(filterEveningEventsExcludingFeatured(items, "b").map((item) => item.id)).toEqual(["a"]);
  });

  it("conserve l'événement unique dans le bandeau si c'est le seul disponible", () => {
    const items = [event({ id: "solo", title: "Solo", starts_at: "2026-08-28T20:30:00+02:00" })];

    expect(filterEveningEventsExcludingFeatured(items, "solo").map((item) => item.id)).toEqual(["solo"]);
  });

  it("masque le bandeau quand un seul événement alimente aussi la carte à la une", () => {
    const items = [event({ id: "solo", title: "Solo", starts_at: "2026-08-28T20:30:00+02:00" })];

    expect(shouldHideFeedEveningEventsStrip(items, "solo")).toBe(true);
    expect(shouldHideFeedEveningEventsStrip(items, null)).toBe(false);
  });
});
