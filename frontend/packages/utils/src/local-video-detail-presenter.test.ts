import type { LocalVideoFeedItem } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import {
  formatVideoDetailLocation,
  formatVideoViewCountLabel,
  isVideoDetailNew,
  pickRelatedVideos,
} from "./local-video-detail-presenter";

function makeItem(overrides: Partial<LocalVideoFeedItem> = {}): LocalVideoFeedItem {
  return {
    id: "v1",
    author_user_id: "u1",
    author: { id: "u1", full_name: "Alice", username: "alice", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Boulingrin",
    neighborhood_slug: "boulingrin",
    video_type: "moment",
    title: "Test",
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "https://media.example/v.mp4",
    thumbnail_url: "https://media.example/t.jpg",
    duration_seconds: 168,
    media_width: null,
    media_height: null,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-07-02T10:00:00.000Z",
    created_at: "2026-07-02T09:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 3,
    comment_count: 1,
    view_count: 128,
    liked_by_me: false,
    ...overrides,
  };
}

describe("local-video-detail-presenter", () => {
  it("formats view counts in French", () => {
    expect(formatVideoViewCountLabel(0)).toBe("0 vues");
    expect(formatVideoViewCountLabel(1)).toBe("1 vue");
    expect(formatVideoViewCountLabel(128)).toBe("128 vues");
  });

  it("builds location line from neighborhood", () => {
    expect(formatVideoDetailLocation(makeItem())).toBe("Boulingrin, Reims");
  });

  it("detects recent videos as new", () => {
    expect(isVideoDetailNew(makeItem(), new Date("2026-07-03T10:00:00.000Z"))).toBe(true);
    expect(
      isVideoDetailNew(
        makeItem({ published_at: "2026-05-01T10:00:00.000Z" }),
        new Date("2026-07-03T10:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("picks related videos excluding current", () => {
    const items = [makeItem({ id: "a" }), makeItem({ id: "b" }), makeItem({ id: "c" })];
    expect(pickRelatedVideos(items, "a").map((item) => item.id)).toEqual(["b", "c"]);
  });
});
