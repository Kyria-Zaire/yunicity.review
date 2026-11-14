// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import type { VideosPortalTabId } from "@yunicity/utils";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalVideoSlide } from "@/components/videos/local-video-slide";
import { VideosMobileFeedTopBar } from "@/components/videos/mobile/videos-mobile-feed-top-bar";
import { VideosMobileImmersiveState } from "@/components/videos/mobile/videos-mobile-immersive-state";
import { VideosEditorialStreamRegion } from "@/components/videos/videos-editorial-stream-region";

/**
 * VIDEO-REFONTE-L3L4 — fil immersif mobile v2.3 (lot 3) : sélecteur de vue (écran J),
 * son dans la barre haute, trois vues dans le fil (D-Q1), états vide et erreur (V1, V2),
 * paysage droit et entier (écran D).
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const tier = { value: "mobile" as "mobile" | "medium" | "desktop" };
vi.mock("@/hooks/use-videos-viewport-tier", () => ({ useVideosViewportTier: () => tier.value }));
vi.mock("@/hooks/use-video-feed-autoplay", () => ({ useVideoFeedAutoplay: (ids: string[]) => ids[0] ?? null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/videos/video-comments-sheet", () => ({ VideoCommentsSheet: () => null }));
// Catalogue medium / desktop (hors périmètre, dépend de l'authentification) : doublures neutres.
vi.mock("@/components/videos/desktop/videos-desktop-feed-stream", () => ({
  VideosDesktopFeedStream: () => <div data-testid="desktop-stream" />,
}));
vi.mock("@/components/videos/mobile", async (importActual) => ({
  ...(await importActual<typeof import("@/components/videos/mobile")>()),
  VideosMobileFeaturedHero: () => null,
  VideosMobileGridCard: () => null,
  VideosMobileSubscriptionsRail: () => null,
}));

Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
Object.defineProperty(HTMLMediaElement.prototype, "pause", { configurable: true, value: vi.fn() });
vi.stubGlobal(
  "fetch",
  vi.fn(() => {
    throw new Error("Requête réseau interdite dans ce test");
  }),
);

function item(id: string, layout: "portrait" | "landscape" = "portrait"): LocalVideoFeedItem {
  const [width, height] = layout === "portrait" ? [720, 1280] : [1280, 720];
  return {
    id,
    author_user_id: "u1",
    author: { id: "u1", username: "camille", full_name: "Camille R.", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre-ville",
    neighborhood_slug: "centre-ville",
    video_type: "quartier",
    title: "Marché de Noël",
    description: "Les chalets des Hautes Promenades ouvrent ce soir.",
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "/media/qa/qa-sample-video.webm",
    thumbnail_url: "/media/qa/qa-sample-video.png",
    duration_seconds: 24,
    media_width: width,
    media_height: height,
    mime_type: "video/webm",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-11-13T10:00:00.000Z",
    created_at: "2026-11-13T10:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 24,
    comment_count: 8,
    view_count: 0,
    liked_by_me: false,
  };
}

beforeEach(() => {
  tier.value = "mobile";
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Barre haute — sélecteur de vue (écran J)", () => {
  function renderBar(tab: VideosPortalTabId = "all") {
    const onTabChange = vi.fn();
    render(<VideosMobileFeedTopBar variant="discovery" tab={tab} onTabChange={onTabChange} />);
    return onTabChange;
  }

  it("annonce la vue courante et ouvre un menu de trois vues, sans Abonnements", () => {
    renderBar();
    const button = screen.getByRole("button", { name: "Vue : Pour vous — changer de vue" });
    expect(button.getAttribute("aria-haspopup")).toBe("menu");
    expect(button.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(button);

    expect(button.getAttribute("aria-expanded")).toBe("true");
    const menu = screen.getByRole("menu", { name: "Choisir une vue" });
    const items = screen.getAllByRole("menuitemradio");
    expect(items.map((element) => element.textContent?.trim())).toEqual(["Pour vous", "Tendances", "Nouveautés"]);
    expect(items[0]!.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(items[0]);
    expect(menu.textContent).not.toMatch(/Abonnements/);
  });

  it("choisir Tendances change de vue, ferme le menu et rend le focus au bouton", () => {
    const onTabChange = renderBar();
    const button = screen.getByRole("button", { name: /^Vue : / });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Tendances" }));

    expect(onTabChange).toHaveBeenCalledWith("trending");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it("clavier : flèches entre les vues, Échap ferme sans changer de vue", () => {
    const onTabChange = renderBar("new");
    const button = screen.getByRole("button", { name: "Vue : Nouveautés — changer de vue" });
    fireEvent.click(button);
    const menu = screen.getByRole("menu");
    const items = screen.getAllByRole("menuitemradio");
    expect(document.activeElement).toBe(items[2]);

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(document.activeElement).toBe(items[2]);

    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(button);
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("son : « Activer le son » quand il est coupé, « Couper le son » sinon", () => {
    const onToggle = vi.fn();
    const { rerender } = render(<VideosMobileFeedTopBar variant="detail" tab="all" sound={{ isMuted: true, onToggle }} />);
    fireEvent.click(screen.getByRole("button", { name: "Activer le son" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<VideosMobileFeedTopBar variant="detail" tab="all" sound={{ isMuted: false, onToggle }} />);
    expect(screen.getByRole("button", { name: "Couper le son" })).toBeTruthy();
    // Lien partagé : retour aux vidéos à la place du sélecteur.
    expect(screen.getByRole("link", { name: "Retour aux vidéos" }).getAttribute("href")).toBe("/videos");
    expect(screen.queryByRole("button", { name: /^Vue : / })).toBeNull();
  });
});

describe("États du fil immersif (V1, V2)", () => {
  it("Tendances vide : message de la règle actuelle et retour à « Pour vous »", () => {
    const onTabChange = vi.fn();
    render(<VideosMobileImmersiveState kind="empty" tab="trending" onTabChange={onTabChange} onRetry={vi.fn()} />);
    expect(screen.getByRole("status").textContent).toContain("Aucune vidéo tendance pour le moment.");
    fireEvent.click(screen.getByRole("button", { name: "Voir « Pour vous »" }));
    expect(onTabChange).toHaveBeenCalledWith("all");
  });

  it("Nouveautés vide : règle des 14 jours", () => {
    render(<VideosMobileImmersiveState kind="empty" tab="new" onTabChange={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByRole("status").textContent).toContain("Aucune nouvelle vidéo ces 14 derniers jours.");
  });

  it("Pour vous vide : invite à publier, sans boucle vers la même vue", () => {
    render(<VideosMobileImmersiveState kind="empty" tab="all" onTabChange={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Voir « Pour vous »" })).toBeNull();
    expect(screen.getByRole("link", { name: "Publier une vidéo" }).getAttribute("href")).toBe("/videos/new");
  });

  it("erreur : alerte distincte de la vue vide, avec « Réessayer »", () => {
    const onRetry = vi.fn();
    render(<VideosMobileImmersiveState kind="error" tab="new" onTabChange={vi.fn()} onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain("Impossible de charger les vidéos.");
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    // Ni son ni recherche sans vidéo.
    expect(screen.queryByRole("button", { name: /son/ })).toBeNull();
  });
});

describe("Aiguillage mobile (D-Q1)", () => {
  function renderRegion(tab: VideosPortalTabId, overrides: { isLoading?: boolean; error?: string | null; items?: LocalVideoFeedItem[] } = {}) {
    return render(
      <VideosEditorialStreamRegion
        tab={tab}
        isLoading={overrides.isLoading ?? false}
        error={overrides.error ?? null}
        emptyMessage="vide"
        visibleItems={overrides.items ?? [item("v1"), item("v2")]}
        featuredItems={[]}
        creators={[]}
        onRetry={vi.fn()}
        loadMore={null}
        onToggleLike={vi.fn()}
        onShare={vi.fn()}
        onOpenReport={vi.fn()}
        onCommentCountDelta={vi.fn()}
        onTabChange={vi.fn()}
      />,
    );
  }

  it.each(["all", "trending", "new"] as const)("%s : fil immersif, sans l'ancien catalogue mobile", (tab) => {
    const { container } = renderRegion(tab);
    expect(container.querySelector("[data-videos-discovery-immersive]")).not.toBeNull();
    expect(container.querySelectorAll("[data-video-slide-id]")).toHaveLength(2);
    expect(container.querySelector(".videos-discovery-mobile-only")).toBeNull();
    expect(container.textContent).not.toMatch(/Créateurs du fil|Les plus récentes/);
  });

  it("chargement, erreur et vide restent dans le cadre immersif", () => {
    const loading = renderRegion("trending", { isLoading: true });
    expect(loading.container.querySelector('[data-videos-immersive-state="loading"]')).not.toBeNull();
    loading.unmount();
    const failed = renderRegion("trending", { error: "load_failed" });
    expect(failed.container.querySelector('[data-videos-immersive-state="error"]')).not.toBeNull();
    failed.unmount();
    const empty = renderRegion("trending", { items: [] });
    expect(empty.container.querySelector('[data-videos-immersive-state="empty"]')).not.toBeNull();
  });

  it("medium et desktop : aucun changement d'aiguillage", () => {
    tier.value = "medium";
    const { container } = renderRegion("trending");
    expect(container.querySelector("[data-videos-discovery-immersive]")).toBeNull();
  });
});

describe("Paysage (écran D)", () => {
  function renderLandscape() {
    return render(
      <LocalVideoSlide
        item={item("v-land", "landscape")}
        isActive
        isMuted
        onOpenComments={vi.fn()}
        onToggleLike={vi.fn()}
        onShare={vi.fn()}
        onOpenMore={vi.fn()}
        onOpenDescription={() => {}}
      />,
    );
  }

  it("vidéo droite et entière : aucune rotation, `contain`, cadre au rapport d'origine", () => {
    renderLandscape();
    const video = document.querySelector("video")!;
    expect(video.className).toContain("object-contain");
    expect(video.className).not.toMatch(/rotate/);
    expect((video.parentElement as HTMLElement).style.aspectRatio).toBe("1280 / 720");
  });

  it("légende hors de l'image, sans voile ; colonne sur fond discret", () => {
    renderLandscape();
    const caption = document.querySelector<HTMLElement>("[data-video-caption]")!;
    const frame = document.querySelector("video")!.parentElement!;
    expect(frame.contains(caption)).toBe(false);
    expect(document.querySelector(".videos-slide-bottom-chrome")!.className).not.toMatch(/rgba\(17,24,39/);
  });

  it("« Plein écran » demande le plein écran de la vidéo", () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, "requestFullscreen", { configurable: true, value: requestFullscreen });
    renderLandscape();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Plein écran" }));
    });
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });
});

describe("Portrait (écrans A et C)", () => {
  it("bande voilée à 60 %, légende sur une ligne, puce quartier ; pause = bouton central", () => {
    render(
      <LocalVideoSlide
        item={item("v-por")}
        isActive
        isMuted
        onOpenComments={vi.fn()}
        onToggleLike={vi.fn()}
        onShare={vi.fn()}
        onOpenMore={vi.fn()}
        onOpenDescription={() => {}}
      />,
    );
    const band = document.querySelector(".videos-slide-bottom-chrome")!;
    expect(band.className).toContain("bg-[rgba(17,24,39,0.6)]");
    const caption = document.querySelector("[data-video-caption]")!;
    expect(caption.querySelector("p.truncate")!.textContent).toBe(
      "Marché de Noël — Les chalets des Hautes Promenades ouvrent ce soir.",
    );
    expect(caption.textContent).toContain("Centre-ville");
    expect(caption.textContent).not.toMatch(/Son original|#Reims|Explorer/);

    fireEvent.click(screen.getByRole("button", { name: "Mettre en pause" }));
    expect(screen.getByRole("button", { name: "Reprendre la lecture" })).toBeTruthy();
  });
});
