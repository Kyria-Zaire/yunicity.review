import { describe, expect, it } from "vitest";

import type { FeedPost, Tribe } from "@yunicity/types";

import {
  buildFeedStoryShortcuts,
  buildFeedTribeActivityItems,
  filterFeedPostsByView,
  formatFeedRelativeTime,
} from "./feed-portal";

const BASE_POST: FeedPost = {
  id: "p1",
  type: "post",
  author: {
    type: "citizen",
    id: "u1",
    display_name: "Marie",
    username: "marie",
    logo_url: null,
  },
  city: "Reims",
  title: null,
  body: "Concert jazz ce soir au centre-ville",
  media_url: null,
  location: null,
  like_count: 5,
  comment_count: 2,
  liked_by_me: false,
  offer: null,
  event: null,
  creator_content: null,
  neighborhood_summary: { slug: "centre-ville", display_name: "Centre-ville" },
  created_at: new Date().toISOString(),
  updated_at: "",
};

describe("feed-portal", () => {
  it("formats relative time", () => {
    const now = new Date();
    expect(formatFeedRelativeTime(now.toISOString(), now)).toBe("À l'instant");
  });

  it("sorts popular by likes", () => {
    const low = { ...BASE_POST, id: "p2", like_count: 1 };
    const high = { ...BASE_POST, id: "p3", like_count: 10 };
    const sorted = filterFeedPostsByView([low, high], "popular");
    expect(sorted[0]?.id).toBe("p3");
  });

  it("filters for_you by interests", () => {
    const music = { ...BASE_POST, body: "Concert jazz local" };
    const other = { ...BASE_POST, id: "p4", body: "Recette de tarte" };
    const filtered = filterFeedPostsByView([other, music], "for_you", { interests: ["music"] });
    expect(filtered.map((p) => p.id)).toEqual(["p1"]);
  });

  it("builds story shortcuts with publish first", () => {
    const items = buildFeedStoryShortcuts({
      city: "Reims",
      profile: { display_name: "Kyria", username: "kyria", avatar_url: null },
      tribes: [],
      events: [],
      culturalPlaces: [],
    });
    expect(items[0]?.kind).toBe("publish");
  });

  it("marks tribe activity when event tonight", () => {
    const tribe: Tribe = {
      id: "t1",
      slug: "jazz",
      name: "Jazz Reims",
      description: "",
      city: "Reims",
      category: "music",
      visibility: "public",
      persistence_kind: "default",
      cover_image_url: null,
      is_featured: false,
      member_limit: 50,
      active_member_count: 3,
      is_archived: false,
      viewer_is_member: true,
      viewer_role: "member",
      created_at: "",
      updated_at: "",
    };
    const items = buildFeedTribeActivityItems({
      city: "Reims",
      tribes: [tribe],
      events: [
        {
          id: "e1",
          organization_id: null,
          title: "Rencontre Jazz Reims",
          description: "",
          event_type: "local_concert",
          city: "Reims",
          district: null,
          starts_at: "2026-05-28T20:00:00.000Z",
          ends_at: null,
          timezone: "Europe/Paris",
          location_name: "Le Millésime",
          address: null,
          latitude: null,
          longitude: null,
          cover_image_url: null,
          moderation_status: "approved",
          is_cancelled: false,
          interested_by_me: false,
          organization: null,
          created_at: "",
        },
      ],
      now: new Date("2026-05-28T16:00:00.000Z"),
    });
    expect(items[0]?.hasActivity).toBe(true);
  });
});
