// @vitest-environment jsdom

/**
 * VIDEO-SAFARI-SCROLL-01 — ré-alignement snap quand la hauteur du feed change.
 */
import type { LocalVideoFeedItem } from "@yunicity/types";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalVideoFeedViewport } from "@/components/videos/local-video-feed-viewport";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/use-video-feed-autoplay", () => ({
  useVideoFeedAutoplay: (ids: string[]) => ids[0] ?? null,
}));

vi.mock("@/components/videos/local-video-slide", () => ({
  LocalVideoSlide: ({ item }: { item: { id: string } }) => (
    <div data-video-slide-id={item.id} style={{ height: "100%" }} />
  ),
}));

function item(id: string): LocalVideoFeedItem {
  return {
    id,
    author_user_id: "u1",
    author: { id: "u1", username: "a", full_name: "A", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "quartier",
    title: id,
    description: "d",
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "/m.webm",
    thumbnail_url: "/m.png",
    duration_seconds: 10,
    media_width: 720,
    media_height: 1280,
    mime_type: "video/webm",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-11-13T10:00:00.000Z",
    created_at: "2026-11-13T10:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    liked_by_me: false,
  };
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("VIDEO-SAFARI-SCROLL-01 — resnap", () => {
  function mountFeed() {
    const observers: ResizeObserverCallback[] = [];
    class FakeRO {
      constructor(cb: ResizeObserverCallback) {
        observers.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", FakeRO);

    const items = [item("a"), item("b"), item("c")];
    render(
      <div style={{ height: 600, position: "relative" }}>
        <LocalVideoFeedViewport
          items={items}
          isMuted
          onActiveVideoChange={() => {}}
          onOpenComments={() => {}}
          onToggleLike={() => {}}
          onShare={() => {}}
          onOpenMore={() => {}}
          onOpenDescription={() => {}}
        />
      </div>,
    );

    const viewport = document.querySelector<HTMLElement>(".videos-feed-viewport");
    expect(viewport).not.toBeNull();
    if (!viewport) throw new Error("missing viewport");

    Object.defineProperty(viewport, "clientHeight", { configurable: true, get: () => 600 });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 600,
    });
    const scrollTo = vi.fn((opts: ScrollToOptions) => {
      Object.defineProperty(viewport, "scrollTop", {
        configurable: true,
        writable: true,
        value: opts.top ?? 0,
      });
    });
    viewport.scrollTo = scrollTo as unknown as typeof viewport.scrollTo;
    return { viewport, scrollTo, observers };
  }

  it("ré-aligne scrollTop sur l'index de slide après ResizeObserver", () => {
    const { viewport, scrollTo, observers } = mountFeed();

    act(() => {
      for (const cb of observers) {
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      }
    });

    Object.defineProperty(viewport, "clientHeight", { configurable: true, get: () => 500 });
    act(() => {
      for (const cb of observers) {
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      }
    });

    expect(scrollTo).toHaveBeenCalled();
    const last = scrollTo.mock.calls.at(-1)?.[0] as ScrollToOptions;
    expect(last.top).toBe(500);

    vi.unstubAllGlobals();
  });

  it("ré-aligne après fin de geste si arrêt entre deux cartes", () => {
    vi.useFakeTimers();
    const { viewport, scrollTo } = mountFeed();
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 280,
    });

    act(() => {
      viewport.dispatchEvent(new Event("pointerup"));
      vi.advanceTimersByTime(140);
    });

    expect(scrollTo).toHaveBeenCalled();
    expect((scrollTo.mock.calls.at(-1)?.[0] as ScrollToOptions).top).toBe(0);

    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 340,
    });
    act(() => {
      viewport.dispatchEvent(new Event("pointerdown"));
      viewport.dispatchEvent(new Event("pointerup"));
      vi.advanceTimersByTime(140);
    });
    expect((scrollTo.mock.calls.at(-1)?.[0] as ScrollToOptions).top).toBe(600);

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("ne resnap pas pendant un swipe (pointerdown)", () => {
    const observers: ResizeObserverCallback[] = [];
    class FakeRO {
      constructor(cb: ResizeObserverCallback) {
        observers.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", FakeRO);

    const items = [item("a"), item("b"), item("c")];
    render(
      <div style={{ height: 600, position: "relative" }}>
        <LocalVideoFeedViewport
          items={items}
          isMuted
          onActiveVideoChange={() => {}}
          onOpenComments={() => {}}
          onToggleLike={() => {}}
          onShare={() => {}}
          onOpenMore={() => {}}
          onOpenDescription={() => {}}
        />
      </div>,
    );

    const viewport = document.querySelector<HTMLElement>(".videos-feed-viewport");
    expect(viewport).not.toBeNull();
    if (!viewport) return;

    Object.defineProperty(viewport, "clientHeight", { configurable: true, get: () => 600 });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 600,
    });
    const scrollTo = vi.fn();
    viewport.scrollTo = scrollTo as unknown as typeof viewport.scrollTo;

    act(() => {
      for (const cb of observers) {
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      }
    });
    act(() => {
      viewport.dispatchEvent(new Event("pointerdown"));
    });
    Object.defineProperty(viewport, "clientHeight", { configurable: true, get: () => 500 });
    act(() => {
      for (const cb of observers) {
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      }
    });
    expect(scrollTo).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
