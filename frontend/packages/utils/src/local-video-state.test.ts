import { describe, expect, it, vi } from "vitest";

import type { LocalVideoFeedItem } from "@yunicity/types";

import {
  applyLocalVideoLikeToggle,
  buildLocalVideoShareUrl,
  isDoubleTap,
  shareLocalVideoWithFallback,
} from "./local-video-state";

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
    video_type: "moment",
    title: "Ce soir au Boulingrin",
    description: "Ambiance top",
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
    distance_meters: null,
    walk_minutes: null,
    like_count: 3,
    comment_count: 1,
    liked_by_me: false,
    ...overrides,
  };
}

describe("local-video social state", () => {
  it("applies optimistic like toggle", () => {
    const liked = applyLocalVideoLikeToggle(baseItem(), true);
    expect(liked.liked_by_me).toBe(true);
    expect(liked.like_count).toBe(4);

    const unliked = applyLocalVideoLikeToggle(liked, false);
    expect(unliked.liked_by_me).toBe(false);
    expect(unliked.like_count).toBe(3);
  });

  it("does not drop like count below zero", () => {
    const item = baseItem({ like_count: 0, liked_by_me: true });
    const toggled = applyLocalVideoLikeToggle(item, false);
    expect(toggled.like_count).toBe(0);
  });

  it("detects double tap within window", () => {
    expect(isDoubleTap(1000, 1200)).toBe(true);
    expect(isDoubleTap(1000, 1400)).toBe(false);
    expect(isDoubleTap(null, 1400)).toBe(false);
  });

  it("builds share deep link", () => {
    expect(buildLocalVideoShareUrl("abc-123", "https://yunicity.fr")).toBe(
      "https://yunicity.fr/videos/abc-123",
    );
  });

  it("falls back to clipboard when Web Share API is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      share: undefined,
      clipboard: { writeText },
    });

    const result = await shareLocalVideoWithFallback(
      baseItem(),
      "https://yunicity.fr",
    );

    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://yunicity.fr/videos/v1");
    vi.unstubAllGlobals();
  });
});
