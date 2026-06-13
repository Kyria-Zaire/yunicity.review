import { describe, expect, it } from "vitest";

import type { LocalVideoFeedItem } from "@yunicity/types";

import {
  LOCAL_VIDEO_DEFAULT_MUTED,
  LOCAL_VIDEO_SOCIAL_PROOF_LABEL,
  LOCAL_VIDEO_TERRITORY_FALLBACK,
  LOCAL_VIDEO_WOW_COPY_MAX_LENGTH,
  buildVideoTerritoryLines,
  formatVideoDistanceLabel,
  formatVideoTemporalLabel,
  formatVideoWalkLabel,
  resolveLocalVideoWowCopy,
  resolveVideoGoCta,
  selectAutoplayVideoId,
  shouldKeepVideoMuted,
  shouldShowLocalVideoSocialProof,
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

  it("formats distance label for nearby videos with vous", () => {
    expect(formatVideoDistanceLabel(650)).toBe("À 650 m de chez vous");
    expect(formatVideoDistanceLabel(800)).toBe("À 800 m de chez vous");
    expect(formatVideoDistanceLabel(null)).toBeNull();
  });

  it("formats walk label when minutes are available", () => {
    expect(formatVideoWalkLabel(12)).toBe("12 min à pied");
    expect(formatVideoWalkLabel(null)).toBeNull();
  });

  it("builds territory lines with city fallback when distance is absent", () => {
    const lines = buildVideoTerritoryLines(
      baseItem({
        distance_meters: null,
        walk_minutes: 12,
        published_at: "2026-06-12T19:28:00.000Z",
      }),
      new Date("2026-06-12T20:00:00.000Z"),
    );
    expect(lines.distance).toBe(LOCAL_VIDEO_TERRITORY_FALLBACK);
    expect(lines.walk).toBe("12 min à pied");
    expect(lines.neighborhood).toBe("Boulingrin");
    expect(lines.temporal).toBe("Il y a 32 min");
  });

  it("selects the most visible slide for autoplay", () => {
    const map = new Map<string, number>([
      ["a", 0.2],
      ["b", 0.82],
      ["c", 0.4],
    ]);
    expect(selectAutoplayVideoId(map)).toBe("b");
  });

  it("formats temporal label from published_at", () => {
    const now = new Date("2026-06-12T20:00:00.000Z");
    expect(formatVideoTemporalLabel("2026-06-12T19:28:00.000Z", now)).toBe("Il y a 32 min");
    expect(formatVideoTemporalLabel("2026-06-12T19:55:00.000Z", now)).toBe("Il y a 5 min");
  });

  it("formats temporal label for today and yesterday", () => {
    const now = new Date("2026-06-12T20:00:00.000Z");
    expect(formatVideoTemporalLabel("2026-06-12T08:00:00.000Z", now)).toBe("Aujourd'hui");
    expect(formatVideoTemporalLabel("2026-06-11T20:00:00.000Z", now)).toBe("Hier");
  });

  describe("resolveLocalVideoWowCopy", () => {
    const now = new Date("2026-06-12T20:00:00.000Z");

    it("returns bon plan copy", () => {
      expect(resolveLocalVideoWowCopy(baseItem({ video_type: "bon_plan" }), now)).toBe(
        "Découvert près de chez vous.",
      );
    });

    it("returns moment copy for upcoming events", () => {
      expect(
        resolveLocalVideoWowCopy(
          baseItem({ video_type: "moment", local_event_id: "evt-1" }),
          now,
        ),
      ).toBe("Encore le temps d'y aller.");
    });

    it("returns quartier copy", () => {
      expect(resolveLocalVideoWowCopy(baseItem({ video_type: "quartier" }), now)).toBe(
        "Une autre façon de voir votre quartier.",
      );
    });

    it("returns lieu copy with city", () => {
      expect(resolveLocalVideoWowCopy(baseItem({ video_type: "lieu" }), now)).toBe(
        "Un endroit à découvrir à Reims.",
      );
    });

    it("returns tribu copy", () => {
      expect(resolveLocalVideoWowCopy(baseItem({ video_type: "tribu" }), now)).toBe(
        "Votre communauté se retrouve ici.",
      );
    });

    it("returns fallback copy for autre", () => {
      expect(resolveLocalVideoWowCopy(baseItem({ video_type: "autre" }), now)).toBe(
        "La ville a toujours quelque chose à raconter.",
      );
    });

    it("keeps wow copy within max length", () => {
      const copy = resolveLocalVideoWowCopy(baseItem({ video_type: "quartier" }), now);
      expect(copy.length).toBeLessThanOrEqual(LOCAL_VIDEO_WOW_COPY_MAX_LENGTH);
    });
  });

  describe("resolveVideoGoCta", () => {
    it("resolves bon plan CTA with place and walk minutes", () => {
      const cta = resolveVideoGoCta(
        baseItem({
          video_type: "bon_plan",
          cultural_place_slug: "maison-cafe",
          cultural_place_name: "Maison & Café",
          walk_minutes: 7,
        }),
      );
      expect(cta.href).toBe("/places/maison-cafe");
      expect(cta.label).toBe("Découvrir le café • 7 min");
      expect(cta.microCopy).toBe("Découvert près de chez vous.");
    });

    it("resolves moment event CTA with walk minutes", () => {
      const cta = resolveVideoGoCta(
        baseItem({ video_type: "moment", local_event_id: "evt-1", walk_minutes: 12 }),
      );
      expect(cta.href).toBe("/events/evt-1");
      expect(cta.label).toBe("Participer ce soir • 12 min");
    });

    it("resolves quartier CTA with neighborhood name", () => {
      const cta = resolveVideoGoCta(
        baseItem({
          video_type: "quartier",
          neighborhood_name: "Saint-Remi",
          neighborhood_slug: "saint-remi",
        }),
      );
      expect(cta.href).toBe("/neighborhoods/saint-remi");
      expect(cta.label).toBe("Explorer Saint-Remi");
    });

    it("resolves lieu CTA with walk minutes", () => {
      const cta = resolveVideoGoCta(
        baseItem({
          video_type: "lieu",
          cultural_place_slug: "forum",
          walk_minutes: 4,
        }),
      );
      expect(cta.href).toBe("/places/forum");
      expect(cta.label).toBe("Voir le lieu • 4 min");
    });

    it("resolves tribu CTA", () => {
      const cta = resolveVideoGoCta(baseItem({ video_type: "tribu", tribe_id: "t1" }));
      expect(cta.href).toBe("/tribes");
      expect(cta.label).toBe("Rejoindre la tribu");
    });

    it("falls back to explorer city when no linked entity", () => {
      const cta = resolveVideoGoCta(
        baseItem({
          video_type: "autre",
          distance_meters: null,
          walk_minutes: null,
          neighborhood_slug: "",
          neighborhood_name: "Reims",
        }),
      );
      expect(cta.href).toBe("/sortir");
      expect(cta.label).toBe("Explorer Reims");
    });
  });

  describe("social proof", () => {
    it("shows social proof when there is engagement", () => {
      expect(shouldShowLocalVideoSocialProof(baseItem({ like_count: 18, comment_count: 0 }))).toBe(
        true,
      );
      expect(shouldShowLocalVideoSocialProof(baseItem({ like_count: 0, comment_count: 4 }))).toBe(
        true,
      );
      expect(shouldShowLocalVideoSocialProof(baseItem())).toBe(false);
    });

    it("uses remois social proof label constant", () => {
      expect(LOCAL_VIDEO_SOCIAL_PROOF_LABEL).toBe("Les Rémois réagissent.");
    });
  });
});
