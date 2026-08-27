import type { FeedPost } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import {
  INITIAL_FEED_PAGINATION_STATE,
  beginFeedPage,
  finishFeedPage,
  rejectFeedPage,
  resolveFeedPage,
} from "@/lib/feed/feed-pagination-state";

function post(id: string): FeedPost {
  return {
    id,
    type: "post",
    author: {
      type: "citizen",
      id: `author-${id}`,
      display_name: "Citoyenne QA",
      username: `qa-${id}`,
      logo_url: null,
    },
    city: "Reims",
    title: null,
    body: `Publication ${id}`,
    media_url: null,
    location: null,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
    offer: null,
    event: null,
    creator_content: null,
    neighborhood_summary: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
  };
}

describe("feed pagination state", () => {
  it("keeps page one and its cursor when page two fails", () => {
    const pageOne = finishFeedPage(
      resolveFeedPage(beginFeedPage(INITIAL_FEED_PAGINATION_STATE, "initial"), "initial", {
        items: [post("one"), post("two")],
        next_cursor: "page-2",
      }),
      "initial",
    );
    const failed = finishFeedPage(
      rejectFeedPage(beginFeedPage(pageOne, "more"), "more", "Append impossible", true),
      "more",
    );

    expect(failed.items.map((item) => item.id)).toEqual(["one", "two"]);
    expect(failed.nextCursor).toBe("page-2");
    expect(failed.error).toBeNull();
    expect(failed.appendError).toBe("Append impossible");
    expect(failed.isLoadingMore).toBe(false);
  });

  it("retries the same cursor, clears append error, and appends once", () => {
    const pageOne = {
      ...INITIAL_FEED_PAGINATION_STATE,
      items: [post("one"), post("two")],
      nextCursor: "page-2",
      isLoading: false,
      appendError: "Append impossible",
    };

    const retrying = beginFeedPage(pageOne, "more");
    expect(retrying.appendError).toBeNull();
    expect(retrying.nextCursor).toBe("page-2");

    const succeeded = finishFeedPage(
      resolveFeedPage(retrying, "more", {
        items: [post("two"), post("three")],
        next_cursor: null,
      }),
      "more",
    );

    expect(succeeded.items.map((item) => item.id)).toEqual(["one", "two", "three"]);
    expect(succeeded.nextCursor).toBeNull();
    expect(succeeded.appendError).toBeNull();
  });

  it("keeps an append retry fail-closed after another failure", () => {
    const retrying = beginFeedPage(
      {
        ...INITIAL_FEED_PAGINATION_STATE,
        items: [post("one")],
        nextCursor: "page-2",
        isLoading: false,
        appendError: "Premier echec",
      },
      "more",
    );
    const failedAgain = finishFeedPage(
      rejectFeedPage(retrying, "more", "Second echec", true),
      "more",
    );

    expect(failedAgain.items.map((item) => item.id)).toEqual(["one"]);
    expect(failedAgain.nextCursor).toBe("page-2");
    expect(failedAgain.appendError).toBe("Second echec");
  });
});
