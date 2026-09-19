// @vitest-environment jsdom

import { cleanup, renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useVideoFeedAutoplay } from "@/hooks/use-video-feed-autoplay";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type ObserverHandle = {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  trigger: (ratio: number, target: Element) => void;
};

function buildScrollRoot(ids: readonly string[]): HTMLDivElement {
  const root = document.createElement("div");
  for (const id of ids) {
    const slide = document.createElement("div");
    slide.setAttribute("data-video-slide-id", id);
    root.appendChild(slide);
  }
  return root;
}

function installIntersectionObserverMock() {
  const handles: ObserverHandle[] = [];
  let constructCount = 0;
  let disconnectCount = 0;

  class MockIntersectionObserver {
    private callback: IntersectionObserverCallback;
    observe = vi.fn();
    disconnect = vi.fn(() => {
      disconnectCount += 1;
    });

    constructor(callback: IntersectionObserverCallback) {
      constructCount += 1;
      this.callback = callback;
      handles.push({
        observe: this.observe,
        disconnect: this.disconnect,
        trigger: (ratio, target) => {
          this.callback(
            [
              {
                target,
                intersectionRatio: ratio,
                isIntersecting: ratio > 0,
                boundingClientRect: {} as DOMRectReadOnly,
                intersectionRect: {} as DOMRectReadOnly,
                rootBounds: null,
                time: 0,
              },
            ],
            this as unknown as IntersectionObserver,
          );
        },
      });
    }
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

  return {
    handles,
    get constructCount() {
      return constructCount;
    },
    get disconnectCount() {
      return disconnectCount;
    },
    resetMetrics() {
      constructCount = 0;
      disconnectCount = 0;
      handles.length = 0;
    },
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useVideoFeedAutoplay — contrat IntersectionObserver", () => {
  let io: ReturnType<typeof installIntersectionObserverMock>;

  beforeEach(() => {
    if (typeof globalThis.CSS === "undefined") {
      vi.stubGlobal("CSS", { escape: (value: string) => value });
    } else if (typeof globalThis.CSS.escape !== "function") {
      globalThis.CSS.escape = (value: string) => value;
    }
    io = installIntersectionObserverMock();
  });

  it("ne recrée pas les observers quand itemIds garde la même référence", () => {
    const itemIds = ["slide-a", "slide-b"];
    const scrollRoot = buildScrollRoot(itemIds);

    const { rerender } = renderHook(
      ({ ids, root }: { ids: string[]; root: HTMLDivElement }) =>
        useVideoFeedAutoplay(ids, null, root),
      { initialProps: { ids: itemIds, root: scrollRoot } },
    );

    const afterMount = io.constructCount;
    expect(afterMount).toBe(2);

    rerender({ ids: itemIds, root: scrollRoot });

    expect(io.constructCount).toBe(afterMount);
    expect(io.disconnectCount).toBe(0);
  });

  it("nettoie puis recrée les observers quand les IDs changent réellement", () => {
    const scrollRoot = buildScrollRoot(["slide-a", "slide-b"]);

    const { rerender } = renderHook(
      ({ ids, root }: { ids: string[]; root: HTMLDivElement }) =>
        useVideoFeedAutoplay(ids, null, root),
      { initialProps: { ids: ["slide-a", "slide-b"], root: scrollRoot } },
    );

    const afterMount = io.constructCount;
    expect(afterMount).toBe(2);

    rerender({ ids: ["slide-a", "slide-c"], root: scrollRoot });

    expect(io.disconnectCount).toBeGreaterThan(0);
    expect(io.constructCount).toBeGreaterThan(afterMount);
  });

  it("nettoie puis recrée les observers quand scrollRoot change", () => {
    const itemIds = ["slide-a", "slide-b"];
    const firstRoot = buildScrollRoot(itemIds);
    const secondRoot = buildScrollRoot(itemIds);

    const { rerender } = renderHook(
      ({ ids, root }: { ids: string[]; root: HTMLDivElement }) =>
        useVideoFeedAutoplay(ids, null, root),
      { initialProps: { ids: itemIds, root: firstRoot } },
    );

    const afterMount = io.constructCount;
    expect(afterMount).toBe(2);

    rerender({ ids: itemIds, root: secondRoot });

    expect(io.disconnectCount).toBeGreaterThan(0);
    expect(io.constructCount).toBeGreaterThan(afterMount);
  });

  it("maintient le pin URL tant que la slide cible n'est pas visible (lock IO)", () => {
    const itemIds = ["slide-a", "slide-b", "slide-c"];
    const scrollRoot = buildScrollRoot(itemIds);

    const { result } = renderHook(() => useVideoFeedAutoplay(itemIds, "slide-b", scrollRoot));

    expect(result.current).toBe("slide-b");

    const slideC = scrollRoot.querySelector('[data-video-slide-id="slide-c"]');
    expect(slideC).not.toBeNull();

    act(() => {
      io.handles[2]?.trigger(0.9, slideC!);
    });

    expect(result.current).toBe("slide-b");

    const slideB = scrollRoot.querySelector('[data-video-slide-id="slide-b"]');
    act(() => {
      io.handles[1]?.trigger(0.75, slideB!);
    });

    expect(result.current).toBe("slide-b");
  });

  it("relâche le lock IO une fois la slide deep-linkée visible", () => {
    const itemIds = ["slide-a", "slide-b", "slide-c"];
    const scrollRoot = buildScrollRoot(itemIds);

    const { result } = renderHook(() => useVideoFeedAutoplay(itemIds, "slide-b", scrollRoot));

    const slideB = scrollRoot.querySelector('[data-video-slide-id="slide-b"]');
    act(() => {
      io.handles[1]?.trigger(0.6, slideB!);
    });

    expect(result.current).toBe("slide-b");

    const slideC = scrollRoot.querySelector('[data-video-slide-id="slide-c"]');
    act(() => {
      io.handles[2]?.trigger(0.9, slideC!);
    });

    expect(result.current).toBe("slide-c");
  });
});
