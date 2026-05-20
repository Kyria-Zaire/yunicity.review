import { describe, expect, it } from "vitest";

import type { Tribe } from "@yunicity/types";

import {
  TRIBES_EMPTY,
  TRIBES_PAGE_SUBTITLE,
  TRIBES_PAGE_TITLE,
  TRIBE_WALL_CONTEXT_BADGE,
  tribeCategoryLabel,
  tribeHref,
  tribeInvitationHref,
  tribeTerritorialLine,
  tribeVisibilityLabel,
} from "./tribe-labels";

const FORBIDDEN_COPY = /trending|top tribu|most active|leaderboard|🔥|discord|@everyone/i;

const sampleTribe: Tribe = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "running-reims",
  name: "Running Reims",
  description: "Groupe de course à pied.",
  city: "Reims",
  category: "sport_local",
  visibility: "public",
  persistence_kind: "persistent",
  cover_image_url: null,
  is_featured: true,
  member_limit: 150,
  active_member_count: 12,
  is_archived: false,
  viewer_is_member: false,
  viewer_role: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("tribe labels", () => {
  it("exposes calm editorial page title", () => {
    expect(TRIBES_PAGE_TITLE).toBe("Tribus");
    expect(TRIBES_PAGE_TITLE.toLowerCase()).not.toContain("trending");
  });

  it("builds tribe href with city query", () => {
    expect(tribeHref("running-reims", "Reims")).toBe("/tribes/running-reims?city=Reims");
  });

  it("formats territorial line as tribu · ville", () => {
    expect(tribeTerritorialLine(sampleTribe)).toBe("Running Reims · Reims");
  });

  it("maps category and visibility without hype", () => {
    expect(tribeCategoryLabel("sport_local")).toBe("Sport local");
    expect(tribeVisibilityLabel("private_invite")).toBe("Sur invitation");
  });

  it("invitation href carries token query", () => {
    expect(tribeInvitationHref("abc123")).toContain("token=abc123");
  });

  it("wall badge is contextual not viral", () => {
    expect(TRIBE_WALL_CONTEXT_BADGE).toBe("Espace tribu");
    expect(TRIBE_WALL_CONTEXT_BADGE).not.toMatch(/live|hot|trending/i);
  });

  it("public copy avoids tribal or hype micro-copy", () => {
    for (const text of [TRIBES_PAGE_TITLE, TRIBES_PAGE_SUBTITLE, TRIBES_EMPTY]) {
      expect(text).not.toMatch(FORBIDDEN_COPY);
    }
  });
});

describe("feed isolation contract (UI)", () => {
  it("FeedPost type has no tribe_id field at API boundary", () => {
    type FeedPostKeys = keyof import("@yunicity/types").FeedPost;
    type TribeIdAbsent = "tribe_id" extends FeedPostKeys ? false : true;
    const check: TribeIdAbsent = true;
    expect(check).toBe(true);
  });
});
