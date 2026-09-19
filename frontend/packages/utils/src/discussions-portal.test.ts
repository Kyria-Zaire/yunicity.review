import { describe, expect, it } from "vitest";

import {
  DISCUSSION_CATEGORY_CHIPS,
  buildDiscussionTribeSidebarItems,
  discussionTagTone,
  formatDiscussionActivityAgo,
} from "./discussions-portal";
import {
  filterInboxItems,
  formatDiscussionInboxTimestamp,
  mapThreadToInboxItem,
  resolveDiscussionStreamMaxWidth,
} from "./discussions-desktop-presenter";
import type { DiscussionThread, Tribe } from "@yunicity/types";

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

describe("discussions-desktop-presenter", () => {
  const thread = {
    id: "post-1",
    discussion_title: "Sortie photo",
    excerpt: "On se retrouve samedi ?",
    body: "On se retrouve samedi ?",
    comment_count: 3,
    author: { id: "u1", display_name: "Léa Martin", logo_url: null, type: "citizen", username: "lea" },
    created_at: "2026-05-29T10:00:00Z",
    last_activity_at: "2026-05-29T11:42:00Z",
  } as DiscussionThread;

  it("maps thread to inbox item", () => {
    const item = mapThreadToInboxItem(thread, new Date("2026-05-29T12:00:00Z"));
    expect(item.title).toBe("Sortie photo");
    expect(item.unreadCount).toBe(3);
    expect(item.timestampLabel).toMatch(/\d{2}:\d{2}|Hier/);
  });

  it("filters unread tab", () => {
    const items = [
      mapThreadToInboxItem(thread),
      mapThreadToInboxItem({ ...thread, id: "post-2", comment_count: 0 } as DiscussionThread),
    ];
    expect(filterInboxItems(items, "unread", "").length).toBe(1);
    expect(filterInboxItems(items, "requests", "").length).toBe(0);
  });

  it("formats inbox timestamp for today", () => {
    const now = new Date("2026-05-29T12:00:00Z");
    expect(formatDiscussionInboxTimestamp("2026-05-29T10:30:00Z", now)).toMatch(/\d{2}:\d{2}/);
  });

  it("starts narrow and widens with conversation length", () => {
    const short = [{ id: "1", body: "Salut", authorName: "A", authorAvatarUrl: null, createdAt: "", timeLabel: "", isOwn: false }];
    const long = Array.from({ length: 8 }, (_, index) => ({
      id: String(index),
      body: "Message",
      authorName: "A",
      authorAvatarUrl: null,
      createdAt: "",
      timeLabel: "",
      isOwn: false,
    }));
    expect(resolveDiscussionStreamMaxWidth(short)).toBe("max-w-md");
    expect(resolveDiscussionStreamMaxWidth(long)).toBe("max-w-3xl");
  });
});
