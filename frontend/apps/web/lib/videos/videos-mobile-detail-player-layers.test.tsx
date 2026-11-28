// @vitest-environment jsdom

/**
 * VIDEO-MEDIUM-CONTROLS-01 — empilement du lecteur detail medium.
 *
 * JSDOM ne peint rien : ces tests vérifient la STRUCTURE déclarée (couches, transparence au
 * pointeur, glyphe de pause non masqué, anneau de focus intérieur). Le ciblage réel des appuis est
 * prouvé dans le navigateur (fiche VIDEO-MEDIUM-CONTROLS-01 §13).
 */

import type { LocalVideoFeedItem } from "@yunicity/types";
import { LOCAL_VIDEO_PLAYBACK_ERROR } from "@yunicity/utils";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VideosMobileDetailPlayer } from "@/components/videos/mobile/videos-mobile-detail-player";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function item(orientation: "portrait" | "landscape"): LocalVideoFeedItem {
  const [width, height] = orientation === "portrait" ? [720, 1280] : [1280, 720];
  return {
    id: `v-${orientation}`,
    author_user_id: "u1",
    author: { id: "u1", username: "citoyen", full_name: "Citoyen", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "moment",
    title: "Vidéo",
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "/media/qa/qa-sample-video.mp4",
    thumbnail_url: "/media/qa/qa-sample-video.png",
    duration_seconds: 42,
    media_width: width,
    media_height: height,
    mime_type: "video/mp4",
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

/** Valeur de l'utilitaire Tailwind `z-N` porté par l'élément (0 si aucun). */
function zLayer(element: Element | null): number {
  const match = element?.getAttribute("class")?.match(/(?:^|\s)z-(\d+)(?:\s|$)/);
  return match ? Number(match[1]) : 0;
}

function classes(element: Element | null): string[] {
  return (element?.getAttribute("class") ?? "").split(/\s+/);
}

function renderPlayer(orientation: "portrait" | "landscape") {
  const view = render(<VideosMobileDetailPlayer item={item(orientation)} portraitContain />);
  const video = view.container.querySelector("video");
  const root = video?.parentElement ?? null;
  return { ...view, video, root };
}

async function startPlayback() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Lire la vidéo" }));
  });
  return screen.getByRole("button", { name: "Mettre en pause" });
}

beforeEach(() => {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
});

describe.each(["portrait", "landscape"] as const)("VideosMobileDetailPlayer — couches (%s)", (orientation) => {
  it("isole le lecteur : ses couches ne concurrencent pas la page", () => {
    const { root } = renderPlayer(orientation);
    expect(classes(root)).toContain("isolate");
  });

  it("place Lire au-dessus de la vidéo", () => {
    const { video } = renderPlayer(orientation);
    expect(zLayer(screen.getByRole("button", { name: "Lire la vidéo" }))).toBeGreaterThan(zLayer(video));
  });

  it("place Pause au-dessus de la vidéo pendant la lecture", async () => {
    const { video } = renderPlayer(orientation);
    const pause = await startPlayback();
    expect(zLayer(pause)).toBeGreaterThan(zLayer(video));
  });

  it("place la barre basse au-dessus du bouton pleine surface, transparente au pointeur hors de ses commandes", async () => {
    renderPlayer(orientation);
    const pause = await startPlayback();
    const slider = screen.getByRole("slider", { name: "Progression de la lecture" });
    const fullscreen = screen.getByRole("button", { name: "Plein écran" });
    const bar = slider.closest("div.absolute");
    expect(zLayer(bar)).toBeGreaterThan(zLayer(pause));
    expect(classes(bar)).toContain("pointer-events-none");
    expect(classes(slider)).toContain("pointer-events-auto");
    expect(classes(fullscreen)).toContain("pointer-events-auto");
  });

  it("garde les badges au-dessus de la vidéo sans capter d'appui", () => {
    const { root, video } = renderPlayer(orientation);
    const badges = Array.from(root?.querySelectorAll(":scope > span") ?? []);
    expect(badges).toHaveLength(2);
    for (const badge of badges) {
      expect(zLayer(badge)).toBeGreaterThan(zLayer(video));
      expect(classes(badge)).toContain("pointer-events-none");
    }
  });

  it("laisse le voile de Lire couvrir les badges au repos, comme avant", () => {
    const { root } = renderPlayer(orientation);
    const play = screen.getByRole("button", { name: "Lire la vidéo" });
    for (const badge of Array.from(root?.querySelectorAll(":scope > span") ?? [])) {
      expect(zLayer(badge)).toBe(zLayer(play));
      expect(badge.compareDocumentPosition(play) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("affiche le glyphe de pause en permanence pendant la lecture", async () => {
    renderPlayer(orientation);
    const pause = await startPlayback();
    const glyph = pause.querySelector("span");
    expect(classes(glyph)).not.toContain("opacity-0");
    expect(classes(glyph).some((name) => name.startsWith("hover:opacity"))).toBe(false);
  });

  it("dessine l'anneau de focus de Lire / Pause à l'intérieur du lecteur (non rogné par overflow-hidden)", async () => {
    const { root } = renderPlayer(orientation);
    expect(classes(root)).toContain("overflow-hidden");
    expect(classes(screen.getByRole("button", { name: "Lire la vidéo" }))).toContain("focus-visible:ring-inset");
    const pause = await startPlayback();
    expect(classes(pause)).toContain("focus-visible:ring-inset");
  });

  it("garde le message d'erreur au-dessus de la vidéo sans capter d'appui", () => {
    const { video } = renderPlayer(orientation);
    fireEvent.error(video!);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe(LOCAL_VIDEO_PLAYBACK_ERROR);
    expect(zLayer(alert)).toBeGreaterThan(zLayer(video));
    expect(classes(alert)).toContain("pointer-events-none");
  });
});
