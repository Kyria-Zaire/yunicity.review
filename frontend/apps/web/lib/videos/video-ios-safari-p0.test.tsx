// @vitest-environment jsdom

/**
 * VIDEO-REFONTE-IOS-SAFARI-P0-02 — non-régression des 3 correctifs iPhone Safari.
 */
import { DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS } from "@yunicity/utils";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VideosMobileFiltersSheet } from "@/components/videos/mobile/videos-mobile-filters-sheet";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import {
  resolveVideosMobileNavBandPx,
  useVideosMobileImmersiveViewport,
  VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR,
  VIDEOS_MOBILE_NAV_BAND_BOTTOM_VAR,
} from "@/hooks/use-videos-mobile-immersive-viewport";
import { CITIZEN_BOTTOM_NAV_HEIGHT_VAR } from "@/lib/layout/feed-mobile-refonte";
import { readFileSync } from "node:fs";
import { join } from "node:path";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({
    listLocalVideoComments: vi.fn(async () => ({ items: [] })),
    createLocalVideoComment: vi.fn(),
    deleteLocalVideoComment: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  document.documentElement.style.cssText = "";
  // Restaure un visualViewport minimal si un test l'a patché.
  Reflect.deleteProperty(window, "visualViewport");
});

function feedItem() {
  return {
    id: "v1",
    author_user_id: "u1",
    author: { id: "u1", username: "a", full_name: "A", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "quartier" as const,
    title: "T",
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
    status: "published" as const,
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

function Probe({ active = true }: { active?: boolean }) {
  useVideosMobileImmersiveViewport(active);
  return null;
}

function mockVisualViewport(height: number) {
  type Listener = EventListenerOrEventListenerObject;
  const listeners = new Map<string, Set<Listener>>();
  const vv = {
    height,
    width: 390,
    offsetTop: 0,
    offsetLeft: 0,
    scale: 1,
    addEventListener: (type: string, listener: Listener) => {
      const set = listeners.get(type) ?? new Set<Listener>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, listener: Listener) => {
      listeners.get(type)?.delete(listener);
    },
    dispatch: (type: string) => {
      for (const listener of listeners.get(type) ?? []) {
        if (typeof listener === "function") listener(new Event(type));
        else listener.handleEvent(new Event(type));
      }
    },
  };
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    writable: true,
    value: vv,
  });
  return vv;
}

describe("P0-A — commentaires : textarea ≥ 16 px, pas de maximum-scale", () => {
  it("utilise text-base sur le textarea (seuil Safari iOS anti-zoom auto)", () => {
    render(<VideoCommentsSheet open video={feedItem()} onClose={() => {}} />);

    const textarea = screen.getByLabelText("Écrire un commentaire");
    expect(textarea.className).toContain("text-base");
    expect(textarea.className).not.toContain("text-sm");
  });

  it("restaure les styles viewport et ignore un scale > 1 (zoom manuel conservé)", () => {
    const source = readFileSync(
      join(process.cwd(), "components/videos/video-comments-sheet.tsx"),
      "utf8",
    );
    expect(source).toContain("clearCommentsPanelViewportStyles");
    expect(source).toContain("vv.scale");
    expect(source).not.toMatch(/document\.querySelector\(['"]meta\[name=['"]viewport/);
    expect(source).not.toMatch(/setAttribute\(\s*['"]content['"].*maximum-scale/);
  });
});

describe("P0-B — hauteur immersif alignée sur nav mesurée + visualViewport", () => {
  it("publie des hauteurs px sur le shell à partir de la nav mesurée", () => {
    const shell = document.createElement("div");
    shell.className = "videos-mobile-shell";
    document.body.appendChild(shell);

    const nav = document.createElement("nav");
    nav.className = "web-mobile-strategic-bottom-nav";
    Object.defineProperty(nav, "getBoundingClientRect", {
      value: () => ({
        height: 87,
        width: 390,
        top: 757,
        bottom: 844,
        left: 0,
        right: 390,
        x: 0,
        y: 757,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(nav);

    render(<Probe />);

    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_NAV_BAND_BOTTOM_VAR)).toBe("87px");
    const immersive = shell.style.getPropertyValue(VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR);
    expect(immersive).toMatch(/^\d+px$/);
    const px = Number.parseInt(immersive, 10);
    expect(px).toBe(Math.max(0, window.innerHeight - 87));
  });

  it("ignore une --citizen-bottom-nav-h périmée quand la nav est masquée (display:none)", () => {
    document.documentElement.style.setProperty(CITIZEN_BOTTOM_NAV_HEIGHT_VAR, "87px");

    const shell = document.createElement("div");
    shell.className = "videos-mobile-shell";
    document.body.appendChild(shell);

    const nav = document.createElement("nav");
    nav.className = "web-mobile-strategic-bottom-nav";
    nav.style.display = "none";
    Object.defineProperty(nav, "getBoundingClientRect", {
      value: () => ({
        height: 87,
        width: 390,
        top: 0,
        bottom: 87,
        left: 0,
        right: 390,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(nav);

    expect(resolveVideosMobileNavBandPx(nav, "87px")).toBe(0);

    const vv = mockVisualViewport(800);
    render(<Probe />);

    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_NAV_BAND_BOTTOM_VAR)).toBe("0px");
    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR)).toBe("800px");
    expect(vv.height).toBe(800);
  });

  it("recalcule après changement de visualViewport.height + événement resize", () => {
    const shell = document.createElement("div");
    shell.className = "videos-mobile-shell";
    document.body.appendChild(shell);

    const nav = document.createElement("nav");
    nav.className = "web-mobile-strategic-bottom-nav";
    Object.defineProperty(nav, "getBoundingClientRect", {
      value: () => ({
        height: 53,
        width: 390,
        top: 0,
        bottom: 53,
        left: 0,
        right: 390,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(nav);

    const vv = mockVisualViewport(700);
    render(<Probe />);
    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR)).toBe("647px");

    vv.height = 620;
    act(() => {
      vv.dispatch("resize");
    });
    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_NAV_BAND_BOTTOM_VAR)).toBe("53px");
    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR)).toBe("567px");
  });

  it("nettoie les variables CSS immersives au démontage", () => {
    const shell = document.createElement("div");
    shell.className = "videos-mobile-shell";
    document.body.appendChild(shell);

    const nav = document.createElement("nav");
    nav.className = "web-mobile-strategic-bottom-nav";
    Object.defineProperty(nav, "getBoundingClientRect", {
      value: () => ({
        height: 53,
        width: 390,
        top: 0,
        bottom: 53,
        left: 0,
        right: 390,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(nav);

    mockVisualViewport(664);
    const { unmount } = render(<Probe />);
    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_NAV_BAND_BOTTOM_VAR)).toBe("53px");
    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR)).toBe("611px");

    unmount();
    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_NAV_BAND_BOTTOM_VAR)).toBe("");
    expect(shell.style.getPropertyValue(VIDEOS_MOBILE_IMMERSIVE_VIEWPORT_HEIGHT_VAR)).toBe("");
  });

  it("le CSS de repli consomme --citizen-bottom-nav-h (plus de 3.25rem hardcodé seul)", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain("--citizen-bottom-nav-h");
    expect(css).toContain(".web-main-column > div.relative");
    const immersiveBlock = css.slice(
      css.indexOf("Immersif mobile — bande"),
      css.indexOf(".videos-mobile-immersive-feed"),
    );
    expect(immersiveBlock).toContain("--citizen-bottom-nav-h");
    expect(immersiveBlock).not.toMatch(
      /--videos-mobile-nav-band-bottom:\s*calc\(3\.25rem \+ env\(safe-area-inset-bottom\)\)/,
    );
  });
});

describe("P0-C — filtres : scroll propriétaire séparé du pied fixe", () => {
  it("place Popularité et le pied hors du même sticky OverlayPanel", () => {
    render(
      <VideosMobileFiltersSheet
        open
        viewLabel="Pour vous"
        filters={DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS}
        neighborhoods={["centre"]}
        items={[]}
        resultCount={3}
        loadedCount={12}
        onClose={() => {}}
        onReset={() => {}}
        onChange={() => {}}
      />,
    );

    const scroll = document.querySelector("[data-videos-filters-scroll]");
    const footer = document.querySelector("[data-videos-filters-footer]");
    const popularity = document.querySelector("[data-videos-filters-popularity]");
    const commented = screen.getByRole("button", { name: "Les plus commentées" });

    expect(scroll).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(popularity).not.toBeNull();
    expect(scroll?.contains(popularity)).toBe(true);
    expect(scroll?.contains(footer)).toBe(false);
    expect(footer?.className).toContain("shrink-0");
    expect(footer?.className).not.toContain("sticky");
    expect(commented).toBeTruthy();

    const overlayScroll = document.querySelector("[data-yunicity-overlay-scroll]");
    expect(overlayScroll?.className).toMatch(/overflow-hidden/);
  });

  it("après scroll en bas, « Les plus commentées » reste dans la zone scroll (hors footer)", () => {
    render(
      <VideosMobileFiltersSheet
        open
        viewLabel="Pour vous"
        filters={DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS}
        neighborhoods={Array.from({ length: 12 }, (_, i) => `q${i}`)}
        items={[]}
        resultCount={3}
        loadedCount={12}
        onClose={() => {}}
        onReset={() => {}}
        onChange={() => {}}
      />,
    );

    const scroll = document.querySelector<HTMLElement>("[data-videos-filters-scroll]");
    const footer = document.querySelector("[data-videos-filters-footer]");
    const commented = screen.getByRole("button", { name: "Les plus commentées" });
    expect(scroll).not.toBeNull();
    if (!scroll) return;

    Object.defineProperty(scroll, "scrollHeight", { configurable: true, value: 900 });
    Object.defineProperty(scroll, "clientHeight", { configurable: true, value: 280 });
    act(() => {
      scroll.scrollTop = scroll.scrollHeight;
      scroll.dispatchEvent(new Event("scroll"));
    });

    expect(scroll.contains(commented)).toBe(true);
    expect(footer && scroll.contains(footer)).toBe(false);
    expect(commented.getAttribute("aria-pressed")).toBe("false");
    act(() => {
      commented.click();
    });
    expect(commented).toBeTruthy();
  });
});
