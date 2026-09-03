import { describe, expect, it } from "vitest";

import type { LocalVideoFeedItem } from "@yunicity/types";

import {
  LOCAL_VIDEO_PORTRAIT_RATIO_THRESHOLD,
  buildVideoAuthorProfileHref,
  buildVideosPortraitHashtags,
  extractVideoPortalTopics,
  formatVideosPortalSubtitle,
  formatVideosPortraitOriginalSound,
  resolveLocalVideoLayout,
  resolveVideosPortraitDiscoverCta,
  resolveVideosPortraitMapHref,
  resolveVideosPortraitPlaceLabel,
  selectFeedStreamLocalVideo,
  selectFeedStreamLocalVideos,
} from "./local-video-layout";

function feedItem(overrides: Partial<LocalVideoFeedItem> = {}): LocalVideoFeedItem {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    author_user_id: "00000000-0000-4000-8000-000000000002",
    author: {
      id: "00000000-0000-4000-8000-000000000002",
      username: "reims_en_poche",
      full_name: "Reims en poche",
      avatar_url: null,
    },
    city: "Reims",
    neighborhood_id: "00000000-0000-4000-8000-000000000003",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "bon_plan",
    title: "Test",
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "https://example.com/v.mp4",
    thumbnail_url: "https://example.com/t.jpg",
    duration_seconds: 18,
    media_width: 1080,
    media_height: 1920,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-01-01T12:00:00.000Z",
    created_at: "2026-01-01T12:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    liked_by_me: false,
    ...overrides,
  };
}

describe("resolveLocalVideoLayout", () => {
  it("classifie portrait quand height/width dépasse le seuil", () => {
    expect(resolveLocalVideoLayout(feedItem({ media_width: 1080, media_height: 1920 }))).toBe(
      "portrait",
    );
    expect(1920 / 1080).toBeGreaterThan(LOCAL_VIDEO_PORTRAIT_RATIO_THRESHOLD);
  });

  it("classifie paysage pour du 16:9", () => {
    expect(resolveLocalVideoLayout(feedItem({ media_width: 1920, media_height: 1080 }))).toBe(
      "landscape",
    );
  });

  it("retombe sur paysage sans dimensions API", () => {
    expect(resolveLocalVideoLayout(feedItem({ media_width: null, media_height: null }))).toBe(
      "landscape",
    );
  });
});

describe("buildVideoAuthorProfileHref", () => {
  it("construit le lien profil quand le username est connu", () => {
    expect(buildVideoAuthorProfileHref(feedItem())).toBe("/profile/reims_en_poche");
  });

  it("retourne null sans username", () => {
    expect(
      buildVideoAuthorProfileHref(
        feedItem({ author: { ...feedItem().author, username: null } }),
      ),
    ).toBeNull();
  });
});

describe("extractVideoPortalTopics", () => {
  it("agrège les types par fréquence", () => {
    const topics = extractVideoPortalTopics([
      feedItem({ video_type: "bon_plan" }),
      feedItem({ id: "2", video_type: "bon_plan" }),
      feedItem({ id: "3", video_type: "moment" }),
    ]);
    expect(topics[0]?.type).toBe("bon_plan");
    expect(topics[0]?.count).toBe(2);
  });
});

describe("formatVideosPortalSubtitle", () => {
  it("personnalise avec la ville", () => {
    expect(formatVideosPortalSubtitle("Reims")).toBe("Découvrez Reims autrement");
  });
});

describe("portrait panel context", () => {
  it("adapte la pill lieu au type bon_plan / lieu", () => {
    expect(
      resolveVideosPortraitPlaceLabel(
        feedItem({
          video_type: "bon_plan",
          cultural_place_name: "Marché du Boulingrin",
        }),
      ),
    ).toBe("Marché du Boulingrin");
    expect(
      resolveVideosPortraitPlaceLabel(
        feedItem({ video_type: "quartier", neighborhood_name: "Centre" }),
      ),
    ).toBe("Centre");
  });

  it("construit les hashtags ville + type", () => {
    expect(buildVideosPortraitHashtags(feedItem({ video_type: "bon_plan" }))).toEqual([
      "#Reims",
      "#BonnesAdresses",
    ]);
  });

  it("expose une carte quand lat/lng sont connus", () => {
    expect(
      resolveVideosPortraitMapHref(feedItem({ latitude: 49.25, longitude: 4.03 })),
    ).toBe("/map?lat=49.25&lng=4.03");
  });

  it("CTA Découvrir ce lieu pointe vers /places/{slug}", () => {
    const cta = resolveVideosPortraitDiscoverCta(
      feedItem({
        cultural_place_slug: "marche-du-boulingrin",
        cultural_place_name: "Marché du Boulingrin",
      }),
    );
    expect(cta?.label).toBe("Découvrir ce lieu");
    expect(cta?.href).toBe("/places/marche-du-boulingrin");
  });

  it("ne propose pas Explorer ville comme CTA secondaire", () => {
    expect(
      resolveVideosPortraitDiscoverCta(
        feedItem({ cultural_place_slug: null, latitude: 49.25, longitude: 4.03 }),
      ),
    ).toBeNull();
  });

  it("formate le son original avec l'auteur", () => {
    expect(formatVideosPortraitOriginalSound(feedItem())).toBe("Son original · Reims en poche");
  });

  it("priorise une vidéo portrait pour le slot éditorial du fil", () => {
    const landscape = feedItem({
      id: "land",
      media_width: 1920,
      media_height: 1080,
      title: "Paysage",
    });
    const portrait = feedItem({
      id: "port",
      media_width: 1080,
      media_height: 1920,
      title: "Portrait",
    });
    expect(selectFeedStreamLocalVideo([landscape, portrait])?.id).toBe("port");
    expect(selectFeedStreamLocalVideo([landscape])?.id).toBe("land");
    expect(selectFeedStreamLocalVideo([])).toBeNull();
  });

  it("retient portrait et paysage pour le fil (max 2)", () => {
    const landscape = feedItem({
      id: "land",
      media_width: 1920,
      media_height: 1080,
      title: "Paysage",
    });
    const portrait = feedItem({
      id: "port",
      media_width: 1080,
      media_height: 1920,
      title: "Portrait",
    });
    const extra = feedItem({
      id: "extra",
      media_width: 1920,
      media_height: 1080,
      title: "Autre",
    });
    expect(selectFeedStreamLocalVideos([landscape, portrait, extra]).map((v) => v.id)).toEqual([
      "port",
      "land",
    ]);
    expect(selectFeedStreamLocalVideos([landscape]).map((v) => v.id)).toEqual(["land"]);
    expect(selectFeedStreamLocalVideos([])).toEqual([]);
  });
});
