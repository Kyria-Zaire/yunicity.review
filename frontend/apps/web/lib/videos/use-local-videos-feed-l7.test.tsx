// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { LocalVideoFeedItem } from "@yunicity/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listLocalVideos = vi.fn();
/** Objet API stable — sinon `fetchPage` se recrée et le useEffect boucle. */
const api = { listLocalVideos };

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => api,
}));

vi.mock("@/providers/geo-provider", () => ({
  useGeo: () => ({ currentPosition: null }),
}));

import { useLocalVideosFeed } from "@/hooks/use-local-videos-feed";

function pageItem(id: string): LocalVideoFeedItem {
  return {
    id,
    author_user_id: "u",
    author: { id: "a", username: "u", full_name: "U", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "moment",
    title: id,
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "/x.mp4",
    thumbnail_url: "/t.jpg",
    duration_seconds: 10,
    media_width: 1080,
    media_height: 1920,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    liked_by_me: false,
    ranking_reason: null,
  } as unknown as LocalVideoFeedItem;
}

afterEach(() => {
  cleanup();
  listLocalVideos.mockReset();
});

beforeEach(() => {
  listLocalVideos.mockResolvedValue({
    city: "Reims",
    items: [pageItem("a"), pageItem("b")],
    next_cursor: "cursor-1",
  });
});

describe("useLocalVideosFeed — Lot 7 pagination sûre", () => {
  it("dédoublonne les ids à l'append et garde une seule requête concurrente", async () => {
    const { result } = renderHook(() => useLocalVideosFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items.map((i) => i.id)).toEqual(["a", "b"]);
    const afterInitial = listLocalVideos.mock.calls.length;

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    listLocalVideos.mockImplementationOnce(async () => {
      await gate;
      return {
        city: "Reims",
        items: [pageItem("b"), pageItem("c")],
        next_cursor: null,
      };
    });

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });
    expect(listLocalVideos.mock.calls.length).toBe(afterInitial + 1);

    await act(async () => {
      release();
    });
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));
    expect(result.current.items.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(result.current.loadMoreError).toBe(false);
  });

  it("en échec de pagination : conserve les items et expose loadMoreError", async () => {
    const { result } = renderHook(() => useLocalVideosFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(2);

    listLocalVideos.mockRejectedValueOnce(new Error("network"));
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

    expect(result.current.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(result.current.error).toBeNull();
    expect(result.current.loadMoreError).toBe(true);
  });
});
