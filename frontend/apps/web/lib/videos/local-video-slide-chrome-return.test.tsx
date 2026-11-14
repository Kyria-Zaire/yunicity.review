// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import { VIDEOS_MOBILE_MORE_ACTIONS, VIDEOS_MOBILE_SHARE_ACTION } from "@yunicity/utils";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalVideoSlide } from "@/components/videos/local-video-slide";

/**
 * VIDEO-MOBILE-CHROME-RETURN-01 — retour des commandes du fil immersif mobile.
 * Pointeur : l'appui sur la vidéo met en pause et réaffiche la barre. Clavier : le
 * focus entrant réaffiche, la barre reste visible tant que les commandes contiennent
 * le focus clavier. Actions simulées (espions).
 *
 * VIDEO-REFONTE-L3L4 (v2.3, écran A) : seule la BARRE se replie (en fil de 2 px) ;
 * la bande (compte, légende, quartier) et la colonne d'actions restent visibles et
 * ciblables. Les tests de l'ancien repli total sont remplacés et signalés comme tels.
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
    onOpenMore: vi.fn<() => void>(),
  };
  const item = playableItem(layout);
  const view = render(
    <LocalVideoSlide item={item} isActive isMuted pointerOverFeed={pointerOverFeed} {...handlers} />,
  );
  const rerenderWith = (nextPointerOverFeed: boolean) =>
    view.rerender(
      <LocalVideoSlide item={item} isActive isMuted pointerOverFeed={nextPointerOverFeed} {...handlers} />,
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
const likeButton = () => screen.getByRole("button", { name: /^Aimer la vidéo/ });
const profileLink = () => {
  const link = chromeContainers()[0]!.querySelector<HTMLElement>('a[aria-label="Profil du créateur"]');
  if (!link) throw new Error("Lien profil de la légende introuvable");
  return link;
};
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

describe("Chrome replié — pointeur et tactile", () => {
  // Remplace « rend chaque conteneur masqué transparent… » (ancien repli total).
  it("v2.3 : seule la barre se replie en fil de 2 px ; bande et actions restent", () => {
    renderSlide();
    expect(screen.getByRole("button", { name: "Mettre en pause" })).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();

    hideChromeByPlayback();

    expect(screen.queryByRole("button", { name: "Mettre en pause" })).toBeNull();
    expect(screen.getByRole("progressbar", { name: "Progression de la lecture" })).toBeTruthy();
    for (const container of chromeContainers()) {
      expect(container.className).not.toContain("opacity-0");
      expect(container.className).not.toContain("[&_*]:!pointer-events-none");
    }
    expect(likeButton()).toBeTruthy();
    expect(profileLink()).toBeTruthy();
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
        isMuted
        onOpenComments={vi.fn<() => void>()}
        onToggleLike={vi.fn<() => void>()}
        onShare={vi.fn<() => void>()}
        onOpenMore={vi.fn<() => void>()}
      />,
    );
  }

  it("conteneur et légende transparents ; seuls profil et puce quartier sont ciblables", () => {
    renderSlideWithLinks();
    const [bottomChrome] = chromeContainers();
    expect(bottomChrome!.className).toContain("pointer-events-none");

    const metaRoot = bottomChrome!.querySelector<HTMLElement>("[data-video-caption]");
    if (!metaRoot) throw new Error("Légende introuvable");
    expect(metaRoot.className).toContain("pointer-events-none");
    expect(metaRoot.className).not.toContain("pointer-events-auto");

    const interactive = [...metaRoot.querySelectorAll<HTMLElement>("a, button")];
    // v2.3 : profil et puce quartier ; « Voir sur la carte », « Découvrir », le son et
    // les hashtags passent dans la feuille Description (écran E). Suivre retiré (L1).
    expect(interactive.length).toBe(2);
    expect(interactive.some((element) => /Suivre/.test(element.textContent ?? ""))).toBe(false);
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

  // Avant VIDEO-REFONTE-L1, ce garde-fou passait par « Suivre » (désactivé, retiré) ;
  // il porte désormais sur la seule commande du bloc méta toujours présente : le profil.
  it("un appui sur une commande du bloc méta (profil) ne bascule pas la lecture", () => {
    renderSlide();
    expect(screen.queryByRole("button", { name: /Suivre/ })).toBeNull();
    const profile = profileLink();
    profile.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(profile);
    advance(SINGLE_TAP_SETTLE_MS);
    expect(isPlaybackPaused()).toBe(false);
  });

  // Remplace « le chrome masqué reste non ciblable… » : en v2.3 la bande reste affichée.
  it("barre repliée : la bande reste transparente au pointeur, ses liens restent ciblables", () => {
    renderSlideWithLinks();
    hideChromeByPlayback();
    const [bottomChrome] = chromeContainers();
    expect(bottomChrome!.className).toContain("pointer-events-none");
    expect(profileLink().className).toContain("pointer-events-auto");
  });
});

describe("Chrome visible — commandes utilisables (actions simulées)", () => {
  // Le son se règle depuis la barre haute du fil (v2.3) : voir video-mobile-feed-top-bar.test.
  it("pause, J'aime, commentaires, partage et « … » répondent", () => {
    const { handlers } = renderSlide();

    fireEvent.click(screen.getByRole("button", { name: "Mettre en pause" }));
    expect(isPlaybackPaused()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Lire la vidéo" }));
    expect(isPlaybackPaused()).toBe(false);

    fireEvent.click(likeButton());
    fireEvent.click(screen.getByRole("button", { name: /^Ouvrir les commentaires/ }));
    fireEvent.click(screen.getByRole("button", { name: VIDEOS_MOBILE_SHARE_ACTION }));
    fireEvent.click(screen.getByRole("button", { name: VIDEOS_MOBILE_MORE_ACTIONS }));

    expect(handlers.onToggleLike).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenComments).toHaveBeenCalledTimes(1);
    expect(handlers.onShare).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenMore).toHaveBeenCalledTimes(1);
  });
});

describe("Chrome — focus clavier", () => {
  it("le focus entrant réaffiche immédiatement, sans mettre en pause", () => {
    mockFocusVisible(true);
    renderSlide();
    hideChromeByPlayback();

    // Barre repliée : elle n'est plus dans le DOM ; le clavier entre par la légende.
    focusElement(profileLink());

    expect(isChromeVisible()).toBe(true);
    expect(isPlaybackPaused()).toBe(false);
  });

  it("reste visible tant qu'il contient le focus, y compris entre deux commandes", () => {
    mockFocusVisible(true);
    renderSlide();
    hideChromeByPlayback();

    focusElement(profileLink());
    advance(CHROME_AUTO_HIDE_MS * 2);
    expect(isChromeVisible()).toBe(true);

    // Passage d'une commande à l'autre : légende → barre → colonne d'actions.
    focusElement(screen.getByRole("button", { name: "Mettre en pause" }));
    advance(CHROME_AUTO_HIDE_MS * 2);
    expect(isChromeVisible()).toBe(true);

    focusElement(likeButton());
    advance(CHROME_AUTO_HIDE_MS * 2);
    expect(isChromeVisible()).toBe(true);

    focusElement(screen.getByRole("button", { name: /^Ouvrir les commentaires/ }));
    advance(CHROME_AUTO_HIDE_MS * 2);
    expect(isChromeVisible()).toBe(true);
  });

  it("le masquage reprend quand le focus quitte le chrome", () => {
    mockFocusVisible(true);
    renderSlide();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    hideChromeByPlayback();

    focusElement(likeButton());
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

    focusElement(likeButton());
    advance(CHROME_AUTO_HIDE_MS + 50);

    expect(isChromeVisible()).toBe(false);
  });
});
