// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";

import {
  LocalVideoMediumLandscapeStage,
  LocalVideoMediumPortraitStage,
} from "@/components/videos/local-video-slide-frames";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  class ResizeObserverStub {
    private readonly callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      Object.defineProperty(target, "clientWidth", { configurable: true, get: () => 900 });
      Object.defineProperty(target, "clientHeight", { configurable: true, get: () => 536 });
      this.callback([], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("LocalVideoMediumPortraitStage — L5 v1.2", () => {
  it("place nav + actions hors vidéo et cadre portrait plus haut que large", () => {
    const bandRef = createRef<HTMLDivElement>();
    const actionsRef = createRef<HTMLDivElement>();
    render(
      <LocalVideoMediumPortraitStage
        video={<div data-testid="video-surface" />}
        overlays={null}
        meta={<div>meta</div>}
        bar={null}
        thread={null}
        actions={<div data-testid="actions-rail">actions</div>}
        bandRef={bandRef}
        actionsRef={actionsRef}
        onChromeFocus={vi.fn()}
        onChromeBlur={vi.fn()}
        mediaWidth={720}
        mediaHeight={1280}
        nav={{
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          canPrevious: false,
          canNext: true,
        }}
      />,
    );
    expect(document.querySelector("[data-videos-medium-portrait-stage]")).toBeTruthy();
    expect(document.querySelector("[data-videos-medium-side-column]")).toBeTruthy();
    const frame = document.querySelector("[data-videos-medium-video-frame]") as HTMLElement;
    expect(frame).toBeTruthy();
    expect(frame.getAttribute("data-videos-medium-frame-orientation")).toBe("portrait");
    const width = Number.parseFloat(frame.style.width);
    const height = Number.parseFloat(frame.style.height);
    expect(height).toBeGreaterThan(width);
    expect(height / width).toBeCloseTo(1280 / 720, 1);
    const side = document.querySelector("[data-videos-medium-side-column]");
    const videoParent = screen.getByTestId("video-surface").parentElement;
    expect(side && videoParent && !videoParent.contains(side)).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Vidéo précédente" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("paysage medium : méta sous le cadre (fond clair), pas dans le voile", () => {
    const bandRef = createRef<HTMLDivElement>();
    const actionsRef = createRef<HTMLDivElement>();
    render(
      <LocalVideoMediumLandscapeStage
        video={<div data-testid="video-surface" />}
        overlays={null}
        meta={<div data-testid="meta-panel">meta</div>}
        bar={null}
        thread={null}
        actions={<div data-testid="actions-rail">actions</div>}
        bandRef={bandRef}
        actionsRef={actionsRef}
        onChromeFocus={vi.fn()}
        onChromeBlur={vi.fn()}
        mediaWidth={1920}
        mediaHeight={1080}
        onFullscreen={vi.fn()}
        nav={{
          onPrevious: vi.fn(),
          onNext: vi.fn(),
          canPrevious: true,
          canNext: true,
        }}
      />,
    );
    expect(document.querySelector("[data-videos-medium-landscape-stage]")).toBeTruthy();
    const frame = document.querySelector("[data-videos-medium-video-frame]");
    const metaHost = document.querySelector("[data-videos-medium-landscape-meta]");
    expect(frame?.getAttribute("data-videos-medium-frame-orientation")).toBe("landscape");
    expect(metaHost?.contains(screen.getByTestId("meta-panel"))).toBe(true);
    expect(frame?.contains(screen.getByTestId("meta-panel"))).toBe(false);
    const width = Number.parseFloat((frame as HTMLElement).style.width);
    const height = Number.parseFloat((frame as HTMLElement).style.height);
    expect(width).toBeGreaterThan(height);
  });
});
