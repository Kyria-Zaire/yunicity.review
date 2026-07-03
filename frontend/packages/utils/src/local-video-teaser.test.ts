import { describe, expect, it } from "vitest";

import type { LocalVideoFeedItem } from "@yunicity/types";

import {
  buildLocalVideoTeaserHref,
  filterLocalVideoTeasers,
  formatLocalVideoDuration,
  reorderLocalVideoFeedForFocus,
  resolveLocalVideoTeaserTitle,
} from "./local-video-teaser";

function baseItem(overrides: Partial<LocalVideoFeedItem> = {}): LocalVideoFeedItem {
  return {
    id: "v1",
    author_user_id: "u1",
    author: {
      id: "u1",
      username: "kyria",
      full_name: "Kyria",
      avatar_url: null,
    },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Boulingrin",
    neighborhood_slug: "boulingrin",
    video_type: "bon_plan",
    title: "Brunch caché",
    description: null,
    cultural_place_id: "p1",
    cultural_place_slug: "maison-cafe",
    cultural_place_name: "Maison & Café",
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "https://example.com/v.mp4",
    thumbnail_url: "https://example.com/t.jpg",
    duration_seconds: 92,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-06-12T18:00:00.000Z",
    created_at: "2026-06-12T18:00:00.000Z",
    distance_meters: 650,
    walk_minutes: 7,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    liked_by_me: false,
    ...overrides,
  };
}

describe("local-video teaser utils", () => {
  it("builds deep link with video query param", () => {
    expect(buildLocalVideoTeaserHref("abc-123")).toBe("/videos?video=abc-123");
  });

  it("formats duration for teaser badge", () => {
    expect(formatLocalVideoDuration(92)).toBe("1:32");
    expect(formatLocalVideoDuration(8)).toBe("8s");
  });

  it("filters teasers by place slug", () => {
    const items = [
      baseItem({ id: "a", cultural_place_slug: "maison-cafe" }),
      baseItem({ id: "b", cultural_place_slug: "autre-lieu" }),
      baseItem({ id: "c", cultural_place_slug: "maison-cafe" }),
    ];
    const filtered = filterLocalVideoTeasers(items, {
      kind: "place",
      culturalPlaceSlug: "maison-cafe",
    });
    expect(filtered.map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("filters teasers by neighborhood and caps at max", () => {
    const items = [
      baseItem({ id: "a", neighborhood_slug: "saint-remi" }),
      baseItem({ id: "b", neighborhood_slug: "saint-remi" }),
      baseItem({ id: "c", neighborhood_slug: "saint-remi" }),
      baseItem({ id: "d", neighborhood_slug: "saint-remi" }),
    ];
    const filtered = filterLocalVideoTeasers(
      items,
      { kind: "neighborhood", neighborhoodSlug: "saint-remi" },
      2,
    );
    expect(filtered).toHaveLength(2);
  });

  it("filters teasers by event id", () => {
    const items = [
      baseItem({ id: "a", local_event_id: "evt-1" }),
      baseItem({ id: "b", local_event_id: "evt-2" }),
    ];
    const filtered = filterLocalVideoTeasers(items, {
      kind: "event",
      localEventId: "evt-1",
    });
    expect(filtered.map((item) => item.id)).toEqual(["a"]);
  });

  it("returns city feed slice for city filter", () => {
    const items = [baseItem({ id: "a" }), baseItem({ id: "b" }), baseItem({ id: "c" }), baseItem({ id: "d" })];
    expect(filterLocalVideoTeasers(items, { kind: "city" }).map((item) => item.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("reorders feed to focus requested video", () => {
    const items = [baseItem({ id: "a" }), baseItem({ id: "b" }), baseItem({ id: "c" })];
    expect(reorderLocalVideoFeedForFocus(items, "b").map((item) => item.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("resolves teaser title fallback chain", () => {
    expect(resolveLocalVideoTeaserTitle(baseItem())).toBe("Brunch caché");
    expect(
      resolveLocalVideoTeaserTitle(
        baseItem({ title: null, cultural_place_name: "Maison & Café" }),
      ),
    ).toBe("Maison & Café");
  });
});
