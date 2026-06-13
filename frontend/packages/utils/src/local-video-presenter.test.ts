import { describe, expect, it } from "vitest";

import type { LocalVideoFeedItem } from "@yunicity/types";

import {
  LOCAL_VIDEO_DEFAULT_MUTED,
  formatVideoDistanceLabel,
  formatVideoTemporalLabel,
  resolveVideoGoCta,
  selectAutoplayVideoId,
  shouldKeepVideoMuted,
} from "./local-video-presenter";

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
    title: "Café incroyable",
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "https://example.com/v.mp4",
    thumbnail_url: "https://example.com/t.jpg",
    duration_seconds: 12,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-06-12T18:00:00.000Z",
    created_at: "2026-06-12T18:00:00.000Z",
    distance_meters: 800,
    walk_minutes: 12,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
    ...overrides,
  };
}

describe("local-video presenter", () => {
  it("keeps mute by default until user enables sound", () => {
    expect(LOCAL_VIDEO_DEFAULT_MUTED).toBe(true);
    expect(shouldKeepVideoMuted(false)).toBe(true);
    expect(shouldKeepVideoMuted(true)).toBe(false);
  });

  it("formats distance label for nearby videos", () => {
    expect(formatVideoDistanceLabel(800)).toBe("À 800 m de chez toi");
    expect(formatVideoDistanceLabel(null)).toBeNull();
  });

  it("selects the most visible slide for autoplay", () => {
    const map = new Map<string, number>([
      ["a", 0.2],
      ["b", 0.82],
      ["c", 0.4],
    ]);
    expect(selectAutoplayVideoId(map)).toBe("b");
  });

  it("resolves event CTA with walk minutes", () => {
    const cta = resolveVideoGoCta(
      baseItem({ local_event_id: "evt-1", walk_minutes: 12 }),
    );
    expect(cta.href).toBe("/events/evt-1");
    expect(cta.label).toBe("Y aller · 12 min");
  });

  it("resolves place slug CTA", () => {
    const cta = resolveVideoGoCta(
      baseItem({ cultural_place_slug: "cafe-du-forum", walk_minutes: null }),
    );
    expect(cta.href).toBe("/places/cafe-du-forum");
    expect(cta.label).toBe("Y aller");
  });

  it("falls back to neighborhood when no linked entity", () => {
    const cta = resolveVideoGoCta(baseItem({ distance_meters: null, walk_minutes: null }));
    expect(cta.href).toBe("/neighborhoods/boulingrin");
    expect(cta.label).toBe("Découvrir le lieu");
  });

  it("formats temporal label from published_at", () => {
    const now = new Date("2026-06-12T20:00:00.000Z");
    const label = formatVideoTemporalLabel("2026-06-12T19:28:00.000Z", now);
    expect(label).toBe("Il y a 32 min");
  });
});
