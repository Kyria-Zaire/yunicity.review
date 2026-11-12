// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import { LOCAL_VIDEO_REPORT_LABEL, VIDEOS_DESKTOP_SHARE } from "@yunicity/utils";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalVideoSlide } from "@/components/videos/local-video-slide";

/**
 * VIDEO-MOBILE-CHROME-RETURN-01 — retour des commandes du fil immersif mobile.
 * Pointeur : le chrome masqué n'intercepte rien, l'appui sur la vidéo met en
 * pause et réaffiche. Clavier : le focus entrant réaffiche, le chrome reste
 * visible tant qu'il contient le focus clavier. Actions simulées (espions).
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: vi.fn(),
});

vi.mock("@/hooks/use-device-orientation", () => ({
  useDeviceOrientation: () => "portrait",
}));

vi.stubGlobal(
  "fetch",
  vi.fn(() => {
    throw new Error("Requête réseau interdite dans ce test");
  }),
);

const CHROME_AUTO_HIDE_MS = 5_000;
const SINGLE_TAP_SETTLE_MS = 300;

function playableItem(layout: "portrait" | "landscape"): LocalVideoFeedItem {
  const [width, height] = layout === "portrait" ? [720, 1280] : [1280, 720];
  return {
    id: `v-${layout}`,
    author_user_id: "u1",
    author: { id: "u1", username: "citoyen", full_name: "Citoyen Test", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "moment",
    title: "Vidéo de test",
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "/media/qa/qa-sample-video.webm",
    thumbnail_url: "/media/qa/qa-sample-video.png",
    duration_seconds: 12,
    media_width: width,
    media_height: height,
    mime_type: "video/webm",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-01-01T10:00:00.000Z",
    created_at: "2026-01-01T10:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    liked_by_me: false,
  };
}

function renderSlide(layout: "portrait" | "landscape" = "portrait", pointerOverFeed = false) {
  const handlers = {
    onOpenComments: vi.fn<() => void>(),
    onToggleLike: vi.fn<() => void>(),
    onShare: vi.fn<() => void>(),
    onOpenReport: vi.fn<() => void>(),
  };
  const item = playableItem(layout);
  const view = render(
    <LocalVideoSlide item={item} isActive pointerOverFeed={pointerOverFeed} {...handlers} />,
  );
  const rerenderWith = (nextPointerOverFeed: boolean) =>
    view.rerender(
      <LocalVideoSlide item={item} isActive pointerOverFeed={nextPointerOverFeed} {...handlers} />,
    );
  return { handlers, rerenderWith };
}

function article(): HTMLElement {
  const element = document.querySelector<HTMLElement>("article[data-video-slide-id]");
  if (!element) throw new Error("Slide introuvable");
  return element;
}

function video(): HTMLVideoElement {
  const element = article().querySelector("video");
  if (!element) throw new Error("Vidéo introuvable");
  return element;
}

function chromeContainers(): HTMLElement[] {
  return [".videos-slide-bottom-chrome", ".videos-slide-action-rail"].map((selector) => {
    const element = article().querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`${selector} introuvable`);
    return element;
  });
}

const isChromeVisible = () => article().hasAttribute("data-videos-slide-chrome-visible");
const isPlaybackPaused = () => screen.queryByRole("button", { name: "Lire la vidéo" }) !== null;

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function hideChromeByPlayback() {
  advance(CHROME_AUTO_HIDE_MS + 50);
  expect(isChromeVisible()).toBe(false);
  expect(isPlaybackPaused()).toBe(false);
}

/** Simule un focus clavier (`:focus-visible`) ou posé par un clic. */
function mockFocusVisible(value: boolean) {
  const original = Element.prototype.matches;
  return vi.spyOn(Element.prototype, "matches").mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    if (selector === ":focus-visible") return value;
    return original.call(this, selector);
  });
}

function focusElement(element: HTMLElement) {
  act(() => {
    element.focus();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("Chrome masqué — pointeur et tactile", () => {
  it("rend chaque conteneur masqué transparent au pointeur pour tous ses descendants", () => {
    renderSlide();
    for (const container of chromeContainers()) {
      expect(container.className).not.toContain("[&_*]:!pointer-events-none");
    }
    hideChromeByPlayback();
    for (const container of chromeContainers()) {
      expect(container.className).toContain("pointer-events-none");
      expect(container.className).toContain("[&_*]:!pointer-events-none");
      expect(container.className).toContain("opacity-0");
    }
  });

  it.each(["portrait", "landscape"] as const)(
    "%s : un appui sur la vidéo masquée met en pause et réaffiche, durablement",
    (layout) => {
      renderSlide(layout);
      hideChromeByPlayback();

      fireEvent.click(video());
      advance(SINGLE_TAP_SETTLE_MS);

      expect(isPlaybackPaused()).toBe(true);
      expect(isChromeVisible()).toBe(true);
      advance(CHROME_AUTO_HIDE_MS * 2);
      expect(isChromeVisible()).toBe(true);
    },
  );

  it("tactile : la souris simulée (entrée dans le fil) avant le clic n'empêche pas la pause", () => {
    const { rerenderWith } = renderSlide("portrait", false);
    hideChromeByPlayback();

    // Ordre d'un tap : mouseenter synthétique sur le fil, puis click sur la vidéo.
    rerenderWith(true);
    fireEvent.click(video());
    advance(SINGLE_TAP_SETTLE_MS);

    expect(isPlaybackPaused()).toBe(true);
    expect(isChromeVisible()).toBe(true);
    advance(CHROME_AUTO_HIDE_MS * 2);
    expect(isChromeVisible()).toBe(true);
  });

  it("conserve le réaffichage à l'entrée de la souris, puis le masquage automatique", () => {
    const { rerenderWith } = renderSlide("portrait", false);
    hideChromeByPlayback();

    rerenderWith(true);
    expect(isChromeVisible()).toBe(true);
    expect(isPlaybackPaused()).toBe(false);
    advance(CHROME_AUTO_HIDE_MS + 50);
    expect(isChromeVisible()).toBe(false);
  });

  it("non-régression : le double appui aime sans mettre en pause", () => {
    const { handlers } = renderSlide();
    hideChromeByPlayback();

    fireEvent.click(video());
    advance(100);
    fireEvent.click(video());
    advance(SINGLE_TAP_SETTLE_MS);

    expect(handlers.onToggleLike).toHaveBeenCalledTimes(1);
    expect(isPlaybackPaused()).toBe(false);
  });
});

describe("Chrome visible — le bloc méta ne masque plus la vidéo", () => {
  function renderSlideWithLinks() {
    // Lieu culturel : produit à la fois « Voir sur la carte » et le lien « Découvrir ».
    const item: LocalVideoFeedItem = {
      ...playableItem("portrait"),
      cultural_place_slug: "cathedrale-notre-dame",
      cultural_place_name: "Cathédrale Notre-Dame",
    };
    render(
      <LocalVideoSlide
        item={item}
        isActive
        onOpenComments={vi.fn<() => void>()}
        onToggleLike={vi.fn<() => void>()}
        onShare={vi.fn<() => void>()}
        onOpenReport={vi.fn<() => void>()}
      />,
    );
  }

  it("conteneur et bloc méta transparents ; seuls profil, Suivre et liens sont ciblables", () => {
    renderSlideWithLinks();
    const [bottomChrome] = chromeContainers();
    expect(bottomChrome!.className).toContain("pointer-events-none");

    // Deux liens « Profil du créateur » : bloc méta (bas) et rail — on vise le bas.
    const profile = bottomChrome!.querySelector<HTMLElement>('a[aria-label="Profil du créateur"]');
    const metaRoot = profile?.closest<HTMLElement>(".space-y-2\\.5");
    if (!metaRoot) throw new Error("Bloc méta introuvable");
    expect(metaRoot.className).toContain("pointer-events-none");
    expect(metaRoot.className).not.toContain("pointer-events-auto");

    const interactive = [...metaRoot.querySelectorAll<HTMLElement>("a, button")];
    // Profil, Suivre, « Voir sur la carte », lien de découverte.
    expect(interactive.length).toBe(4);
    for (const element of interactive) {
      expect(element.className).toContain("pointer-events-auto");
    }
  });

  it("séquence : masqué → appui = pause et retour → second appui = reprise", () => {
    renderSlide();
    hideChromeByPlayback();

    fireEvent.click(video());
    advance(SINGLE_TAP_SETTLE_MS);
    expect(isPlaybackPaused()).toBe(true);
    expect(isChromeVisible()).toBe(true);

    advance(500);
    fireEvent.click(video());
    advance(SINGLE_TAP_SETTLE_MS);
    expect(isPlaybackPaused()).toBe(false);
    expect(isChromeVisible()).toBe(true);
  });

  it("un appui sur « Suivre » (désactivé) ne bascule pas la lecture", () => {
    renderSlide();
    fireEvent.click(screen.getByRole("button", { name: /Suivre/ }));
    advance(SINGLE_TAP_SETTLE_MS);
    expect(isPlaybackPaused()).toBe(false);
  });

  it("le chrome masqué reste non ciblable pour tous ses descendants", () => {
    renderSlideWithLinks();
    hideChromeByPlayback();
    const [bottomChrome] = chromeContainers();
    expect(bottomChrome!.className).toContain("[&_*]:!pointer-events-none");
  });
});

describe("Chrome visible — commandes utilisables (actions simulées)", () => {
  it("pause, son, like, commentaires, partage et signalement répondent", () => {
    const { handlers } = renderSlide();

    fireEvent.click(screen.getByRole("button", { name: "Mettre en pause" }));
    expect(isPlaybackPaused()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Lire la vidéo" }));
    expect(isPlaybackPaused()).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Activer le son" }));
    expect(screen.getByRole("button", { name: "Couper le son" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Aimer la vidéo" }));
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir les commentaires" }));
    fireEvent.click(screen.getByRole("button", { name: VIDEOS_DESKTOP_SHARE }));
    fireEvent.click(screen.getByRole("button", { name: LOCAL_VIDEO_REPORT_LABEL }));

    expect(handlers.onToggleLike).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenComments).toHaveBeenCalledTimes(1);
    expect(handlers.onShare).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenReport).toHaveBeenCalledTimes(1);
  });
});

describe("Chrome — focus clavier", () => {
  it("le focus entrant réaffiche immédiatement, sans mettre en pause", () => {
    mockFocusVisible(true);
    renderSlide();
    hideChromeByPlayback();

    focusElement(screen.getByRole("button", { name: "Mettre en pause" }));

    expect(isChromeVisible()).toBe(true);
    expect(isPlaybackPaused()).toBe(false);
  });

  it("reste visible tant qu'il contient le focus, y compris entre deux commandes", () => {
    mockFocusVisible(true);
    renderSlide();
    hideChromeByPlayback();

    focusElement(screen.getByRole("button", { name: "Mettre en pause" }));
    advance(CHROME_AUTO_HIDE_MS * 2);
    expect(isChromeVisible()).toBe(true);

    // Passage d'un conteneur à l'autre : barre de lecture → rail d'actions.
    focusElement(screen.getByRole("button", { name: "Aimer la vidéo" }));
    advance(CHROME_AUTO_HIDE_MS * 2);
    expect(isChromeVisible()).toBe(true);

    focusElement(screen.getByRole("button", { name: "Ouvrir les commentaires" }));
    advance(CHROME_AUTO_HIDE_MS * 2);
    expect(isChromeVisible()).toBe(true);
  });

  it("le masquage reprend quand le focus quitte le chrome", () => {
    mockFocusVisible(true);
    renderSlide();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    hideChromeByPlayback();

    focusElement(screen.getByRole("button", { name: "Aimer la vidéo" }));
    advance(CHROME_AUTO_HIDE_MS * 2);
    expect(isChromeVisible()).toBe(true);

    focusElement(outside);
    advance(CHROME_AUTO_HIDE_MS - 100);
    expect(isChromeVisible()).toBe(true);
    advance(200);
    expect(isChromeVisible()).toBe(false);
    outside.remove();
  });

  it("le focus déjà présent sur une commande empêche le masquage automatique", () => {
    mockFocusVisible(true);
    renderSlide();

    focusElement(screen.getByRole("button", { name: "Mettre en pause" }));
    advance(CHROME_AUTO_HIDE_MS * 3);

    expect(isChromeVisible()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Mettre en pause" }));
    expect(isPlaybackPaused()).toBe(true);
  });

  it("un focus posé par un clic (non clavier) ne suspend pas le masquage", () => {
    mockFocusVisible(false);
    renderSlide();

    focusElement(screen.getByRole("button", { name: "Aimer la vidéo" }));
    advance(CHROME_AUTO_HIDE_MS + 50);

    expect(isChromeVisible()).toBe(false);
  });
});
