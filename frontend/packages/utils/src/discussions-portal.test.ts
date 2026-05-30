import { describe, expect, it } from "vitest";

import {
  DISCUSSION_CATEGORY_CHIPS,
  buildDiscussionTribeSidebarItems,
  discussionTagTone,
  formatDiscussionActivityAgo,
} from "./discussions-portal";
import type { Tribe } from "@yunicity/types";

describe("DISCUSSION_CATEGORY_CHIPS", () => {
  it("includes all mockup filters", () => {
    expect(DISCUSSION_CATEGORY_CHIPS.map((c) => c.id)).toEqual([
      "all",
      "questions",
      "tips",
      "news",
      "culture",
      "sports",
      "tribes",
    ]);
  });
});

describe("formatDiscussionActivityAgo", () => {
  it("formats recent activity", () => {
    const now = new Date("2026-05-29T12:00:00Z");
    const iso = new Date("2026-05-29T10:00:00Z").toISOString();
    expect(formatDiscussionActivityAgo(iso, now)).toBe("Il y a 2 h");
  });
});

describe("buildDiscussionTribeSidebarItems", () => {
  it("lists member tribes only", () => {
    const tribes = [
      { id: "1", name: "A", slug: "a", category: "culture", viewer_is_member: true, is_archived: false, active_member_count: 3 },
      { id: "2", name: "B", slug: "b", category: "sports", viewer_is_member: false, is_archived: false, active_member_count: 1 },
    ] as Tribe[];
    const result = buildDiscussionTribeSidebarItems({ city: "Reims", tribes });
    expect(result.visible).toHaveLength(1);
    expect(result.visible[0]?.name).toBe("A");
  });
});

describe("discussionTagTone", () => {
  it("returns tone class", () => {
    expect(discussionTagTone("culture")).toContain("violet");
  });
});
