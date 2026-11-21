// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalVideoDescriptionSheet } from "@/components/videos/local-video-description-sheet";
import { LocalVideoMoreMenu } from "@/components/videos/local-video-more-menu";
import { LocalVideoSlide } from "@/components/videos/local-video-slide";
import { VideosMobileImmersiveFeed } from "@/components/videos/mobile/videos-mobile-immersive-feed";
import { usePauseWhileOpen } from "@/hooks/use-pause-while-open";
import { ActiveReportVideoContext } from "@/lib/videos/active-report-video-context";

/**
 * VIDEO-REFONTE-L3L4 — lot 4 (v2.3) : règle des panneaux (pause, reprise seulement si la
 * vidéo jouait), feuille Description (écran E), menu « … » (écran I), signalement depuis
 * le menu, retour du focus au déclencheur.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

Object.defineProperty(HTMLMediaElement.prototype, "play", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
Object.defineProperty(HTMLMediaElement.prototype, "pause", { configurable: true, value: vi.fn() });
vi.stubGlobal(
  "fetch",
  vi.fn(() => {
    throw new Error("Requête réseau interdite dans ce test");
  }),
);

function item(id = "v1"): LocalVideoFeedItem {
  return {
    id,
    author_user_id: "u1",
    author: { id: "u1", username: "camille.r", full_name: "Camille R.", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre-ville",
    neighborhood_slug: "centre-ville",
    video_type: "quartier",
    title: "Marché de Noël — les chalets des Hautes Promenades",
    description: "Les chalets ouvrent ce soir.\n\nPensez à un sac : beaucoup de chalets n'en donnent plus.",
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "/media/qa/qa-sample-video.webm",
    thumbnail_url: "/media/qa/qa-sample-video.png",
    duration_seconds: 24,
    media_width: 720,
    media_height: 1280,
    mime_type: "video/webm",
    latitude: 49.25,
    longitude: 4.03,
    status: "published",
    published_at: "2026-11-13T10:00:00.000Z",
    created_at: "2026-11-13T10:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 24,
    comment_count: 8,
    view_count: 312,
    liked_by_me: false,
    reason_code: "same_city",
    reason_label: "Autour de vous à Reims",
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("usePauseWhileOpen — règle des panneaux (V4-1)", () => {
  it("jouait : pause à l'ouverture, reprise à la fermeture", () => {
    const setPaused = vi.fn();
    const { rerender } = renderHook(({ open, playing }) => usePauseWhileOpen(open, playing, setPaused), {
      initialProps: { open: false, playing: true },
    });
    rerender({ open: true, playing: true });
    expect(setPaused).toHaveBeenLastCalledWith(true);
    rerender({ open: true, playing: false });
    rerender({ open: false, playing: false });
    expect(setPaused).toHaveBeenLastCalledWith(false);
    expect(setPaused).toHaveBeenCalledTimes(2);
  });

  it("ne jouait pas : aucune pause forcée, et reste en pause à la fermeture", () => {
    const setPaused = vi.fn();
    const { rerender } = renderHook(({ open, playing }) => usePauseWhileOpen(open, playing, setPaused), {
      initialProps: { open: false, playing: false },
    });
    rerender({ open: true, playing: false });
    rerender({ open: false, playing: false });
    expect(setPaused).not.toHaveBeenCalled();
  });
});

describe("Lecteur — panneau ouvert sur la vidéo (écrans E, F)", () => {
  function renderSlide(suspended: boolean) {
    const props = {
      item: item(),
      isActive: true,
      isMuted: true,
      onOpenComments: vi.fn(),
      onToggleLike: vi.fn(),
      onShare: vi.fn(),
      onOpenMore: vi.fn(),
      onOpenDescription: vi.fn(),
    };
    const view = render(<LocalVideoSlide {...props} suspended={suspended} />);
    return { props, rerender: (next: boolean) => view.rerender(<LocalVideoSlide {...props} suspended={next} />) };
  }

  it("lecture → panneau : « En pause », pas de bouton central ; fermeture : reprise", () => {
    const { rerender } = renderSlide(false);
    expect(screen.getByRole("button", { name: "Mettre en pause" })).toBeTruthy();

    rerender(true);
    expect(screen.getByText("En pause")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reprendre la lecture" })).toBeNull();

    rerender(false);
    expect(screen.queryByText("En pause")).toBeNull();
    expect(screen.getByRole("button", { name: "Mettre en pause" })).toBeTruthy();
  });

  it("déjà en pause → panneau → fermeture : la vidéo reste en pause", () => {
    const { rerender } = renderSlide(false);
    fireEvent.click(screen.getByRole("button", { name: "Mettre en pause" }));
    rerender(true);
    rerender(false);
    expect(screen.getByRole("button", { name: "Reprendre la lecture" })).toBeTruthy();
  });

  it("« plus » ouvre la description en transmettant son bouton", () => {
    const { props } = renderSlide(false);
    const more = screen.getByRole("button", { name: "plus" });
    fireEvent.click(more);
    expect(props.onOpenDescription).toHaveBeenCalledWith(more);
  });
});

describe("Feuille Description (écran E)", () => {
  it("montre ce que la légende courte ne montre pas", () => {
    render(<LocalVideoDescriptionSheet video={item()} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Description" });
    const content = within(dialog);
    expect(content.getByRole("heading", { level: 3 }).textContent).toBe("Marché de Noël — les chalets des Hautes Promenades");
    expect(content.getByText("Les chalets ouvrent ce soir.")).toBeTruthy();
    expect(content.getByText("Pensez à un sac : beaucoup de chalets n'en donnent plus.")).toBeTruthy();
    expect(content.getByText("@camille.r")).toBeTruthy();
    expect(dialog.textContent).toContain("312 vues");
    expect(dialog.textContent).toContain("Autour de vous à Reims");
    expect(dialog.textContent).toMatch(/Son original/);
    expect(content.getByRole("button", { name: "Fermer la description" })).toBeTruthy();
  });

  it("Échap ferme la feuille", () => {
    const onClose = vi.fn();
    render(<LocalVideoDescriptionSheet video={item()} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Menu « … » (écran I)", () => {
  it("« Signaler la vidéo » en première ligne, puis « Annuler »", () => {
    const onReport = vi.fn();
    const onClose = vi.fn();
    render(<LocalVideoMoreMenu open onClose={onClose} onReport={onReport} />);
    const dialog = screen.getByRole("dialog", { name: "Plus d'options" });
    const actions = within(dialog)
      .getAllByRole("button")
      .map((button) => button.textContent?.trim())
      .filter((label) => label === "Signaler la vidéo" || label === "Annuler");
    expect(actions).toEqual(["Signaler la vidéo", "Annuler"]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Signaler la vidéo" }));
    expect(onReport).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole("button", { name: "Annuler" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Fil immersif — « … » puis signalement (V4-2)", () => {
  function renderFeed(activeReport: string | null = null) {
    const onOpenReport = vi.fn();
    const view = render(
      <ActiveReportVideoContext.Provider value={activeReport}>
        <VideosMobileImmersiveFeed
          variant="discovery"
          items={[item("v1"), item("v2")]}
          onToggleLike={vi.fn()}
          onShare={vi.fn()}
          onOpenReport={onOpenReport}
          onCommentCountDelta={vi.fn()}
        />
      </ActiveReportVideoContext.Provider>,
    );
    return { onOpenReport, view };
  }

  it("« … » ouvre le menu et met en pause ; « Signaler la vidéo » ouvre le signalement de cette vidéo", () => {
    const { onOpenReport } = renderFeed();
    const active = document.querySelector<HTMLElement>('[data-video-slide-id="v1"]')!;
    fireEvent.click(within(active).getByRole("button", { name: "Plus d'options : signaler" }));

    expect(screen.getByRole("dialog", { name: "Plus d'options" })).toBeTruthy();
    expect(within(active).getByText("En pause")).toBeTruthy();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Signaler la vidéo" }));
    });
    expect(onOpenReport).toHaveBeenCalledWith("v1");
    expect(screen.queryByRole("dialog", { name: "Plus d'options" })).toBeNull();
  });

  it("menu → signalement : aucune reprise intermédiaire, la vidéo reste en pause jusqu'à la fermeture", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play");
    function Harness() {
      const [reportId, setReportId] = useState<string | null>(null);
      return (
        <ActiveReportVideoContext.Provider value={reportId}>
          <VideosMobileImmersiveFeed
            variant="discovery"
            items={[item("v1"), item("v2")]}
            onToggleLike={vi.fn()}
            onShare={vi.fn()}
            onOpenReport={setReportId}
            onCommentCountDelta={vi.fn()}
          />
          <button type="button" onClick={() => setReportId(null)}>
            fermer-signalement
          </button>
        </ActiveReportVideoContext.Provider>
      );
    }
    render(<Harness />);
    const active = document.querySelector<HTMLElement>('[data-video-slide-id="v1"]')!;
    fireEvent.click(within(active).getByRole("button", { name: "Plus d'options : signaler" }));
    expect(within(active).getByText("En pause")).toBeTruthy();
    const playsBeforeReport = play.mock.calls.length;

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Signaler la vidéo" }));
    });
    // Passage menu → signalement : ni appel à play(), ni disparition de « En pause ».
    expect(play.mock.calls.length).toBe(playsBeforeReport);
    expect(within(active).getByText("En pause")).toBeTruthy();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "fermer-signalement" }));
    });
    // Fermeture du signalement : la vidéo jouait avant le menu, elle reprend.
    expect(within(active).queryByText("En pause")).toBeNull();
    expect(play.mock.calls.length).toBeGreaterThan(playsBeforeReport);
  });

  it("signalement ouvert (contexte) : la vidéo concernée reste en pause", () => {
    renderFeed("v1");
    const active = document.querySelector<HTMLElement>('[data-video-slide-id="v1"]')!;
    expect(within(active).getByText("En pause")).toBeTruthy();
  });
});
