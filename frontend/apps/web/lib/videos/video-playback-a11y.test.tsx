// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_PLAYBACK_ERROR,
  LOCAL_VIDEO_PLAYBACK_FALLBACK,
  VIDEO_DETAIL_AUTOPLAY,
  VIDEO_DETAIL_COMMENT,
  VIDEO_DETAIL_LIKE,
  VIDEO_DETAIL_SHARE,
} from "@yunicity/utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoPlaybackBar } from "@/components/videos/local-video-playback-bar";
import { LocalVideoProcessingSlide } from "@/components/videos/local-video-processing-slide";
import { LocalVideoSlide } from "@/components/videos/local-video-slide";
import { VideoDetailSidebar } from "@/components/videos/video-detail-sidebar";
import { VideosMobileDetailPlayer } from "@/components/videos/mobile/videos-mobile-detail-player";
import {
  formatVideoProgressValueText,
  handleVideoProgressKeyDown,
  scrollIntoViewRespectingReducedMotion,
} from "@/lib/videos/video-playback-a11y";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("reduce"),
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

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.stubGlobal(
  "fetch",
  vi.fn(() => {
    throw new Error("Requête réseau interdite dans ce test");
  }),
);

function playableItem(id = "v-a11y"): LocalVideoFeedItem {
  return {
    id,
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
    media_width: 1920,
    media_height: 1080,
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

function keyEvent(key: string): ReactKeyboardEvent {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as ReactKeyboardEvent;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

describe("video-playback-a11y helpers", () => {
  it("formatVideoProgressValueText — temps courant + durée", () => {
    expect(formatVideoProgressValueText(5, 42)).toBe("0:05 sur 0:42");
    expect(formatVideoProgressValueText(0, 0)).toBe("");
  });

  it("handleVideoProgressKeyDown — flèches, Home, End", () => {
    const onSeek = vi.fn();

    handleVideoProgressKeyDown(keyEvent("ArrowRight"), 10, 42, onSeek);
    expect(onSeek).toHaveBeenCalledWith(15 / 42);

    handleVideoProgressKeyDown(keyEvent("Home"), 10, 42, onSeek);
    expect(onSeek).toHaveBeenCalledWith(0);

    handleVideoProgressKeyDown(keyEvent("End"), 10, 42, onSeek);
    expect(onSeek).toHaveBeenCalledWith(1);

    onSeek.mockClear();
    handleVideoProgressKeyDown(keyEvent("ArrowLeft"), 10, 0, onSeek);
    expect(onSeek).not.toHaveBeenCalled();
  });

  it("scrollIntoViewRespectingReducedMotion — auto si reduce", () => {
    const element = document.createElement("div");
    element.scrollIntoView = vi.fn();
    scrollIntoViewRespectingReducedMotion(element, { behavior: "smooth", block: "start" });
    expect(element.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start", inline: "nearest" });
  });
});

describe("LocalVideoPlaybackBar", () => {
  // v2.3 : le son est dans la barre haute du fil (videos-mobile-feed-top-bar), plus ici.
  it("lecture : nom dynamique, aria-pressed, slider clavier, valuetext et durée", () => {
    const onSeek = vi.fn();
    render(
      <LocalVideoPlaybackBar
        currentTime={5}
        duration={42}
        isPaused={false}
        onTogglePause={() => {}}
        onSeek={onSeek}
      />,
    );

    expect(screen.getByRole("button", { name: "Mettre en pause" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("button", { name: /son/ })).toBeNull();
    expect(screen.getByText("0:05 / 0:42")).toBeTruthy();

    const slider = screen.getByRole("slider", { name: "Progression de la lecture" });
    expect(slider.getAttribute("aria-valuetext")).toBe("0:05 sur 0:42");

    fireEvent.keyDown(slider, { key: "Home" });
    expect(onSeek).toHaveBeenCalledWith(0);

    fireEvent.keyDown(slider, { key: "End" });
    expect(onSeek).toHaveBeenCalledWith(1);
  });

  it("focus-visible et cibles tactiles présents", () => {
    render(
      <LocalVideoPlaybackBar
        currentTime={0}
        duration={42}
        isPaused
        onTogglePause={() => {}}
        onSeek={() => {}}
      />,
    );

    const play = screen.getByRole("button", { name: "Lire la vidéo" });
    expect(play.className).toMatch(/min-h-11/);
    expect(play.className).toMatch(/focus-visible:ring-2/);
  });
});

describe("LocalVideoActionRail", () => {
  // Noms accessibles figés v2.3 (maquette, écran A) : « Aimer la vidéo — N J'aime »…
  it("noms v2.3, J'aime aria-pressed, aucun Enregistrer (L1), « … » une fois", () => {
    const onMore = vi.fn();
    const { rerender } = render(
      <LocalVideoActionRail
        likeCount={1}
        commentCount={8}
        likedByMe={false}
        onLikeClick={() => {}}
        onCommentsClick={() => {}}
        onShareClick={() => {}}
        onMoreClick={onMore}
      />,
    );

    const like = screen.getByRole("button", { name: "Aimer la vidéo — 1 J'aime" });
    expect(like.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Ouvrir les commentaires — 8 commentaires" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Partager la vidéo" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Enregistrer/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Plus d'options : signaler" }));
    expect(onMore).toHaveBeenCalledTimes(1);

    rerender(
      <LocalVideoActionRail
        likeCount={2}
        commentCount={1}
        likedByMe
        onLikeClick={() => {}}
        onCommentsClick={() => {}}
        onShareClick={() => {}}
        onMoreClick={onMore}
      />,
    );
    expect(screen.getByRole("button", { name: "Retirer le J'aime — 2 J'aime" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Ouvrir les commentaires — 1 commentaire" })).toBeTruthy();
  });

  it("cibles tactiles de 58 px (44 px pour « … »)", () => {
    render(
      <LocalVideoActionRail
        likeCount={0}
        commentCount={0}
        likedByMe={false}
        onLikeClick={() => {}}
        onCommentsClick={() => {}}
        onShareClick={() => {}}
        onMoreClick={() => {}}
      />,
    );
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toMatch(/h-\[58px\]|h-11/);
      expect(button.className).toMatch(/w-\[58px\]/);
    }
  });
});

describe("VideosMobileDetailPlayer", () => {
  it("erreur source → role alert ; rejet autoplay seul ≠ erreur média", async () => {
    HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(new DOMException("blocked", "NotAllowedError"));

    render(<VideosMobileDetailPlayer item={playableItem()} />);
    expect(screen.queryByRole("alert")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Lire la vidéo" }));
    expect(screen.queryByRole("alert")).toBeNull();

    const video = document.querySelector("video");
    expect(video?.textContent).toContain(LOCAL_VIDEO_PLAYBACK_FALLBACK);
    fireEvent.error(video!);
    expect(screen.getByRole("alert").textContent).toBe(LOCAL_VIDEO_PLAYBACK_ERROR);
  });
});

describe("LocalVideoSlide", () => {
  it("onError média → alert sans confondre avec rejet autoplay", () => {
    HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(new DOMException("blocked", "NotAllowedError"));

    render(
      <LocalVideoSlide
        item={playableItem()}
        isActive
        isMuted
        onOpenComments={() => {}}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenMore={() => {}}
        onOpenDescription={() => {}}
      />,
    );

    expect(screen.queryByRole("alert")).toBeNull();
    const video = document.querySelector("video");
    fireEvent.error(video!);
    expect(screen.getByRole("alert").textContent).toBe(LOCAL_VIDEO_PLAYBACK_ERROR);
  });
});

describe("reduced motion classes", () => {
  it("animate-spin neutralisé sur slide processing", () => {
    const { container } = render(
      <LocalVideoProcessingSlide item={{ ...playableItem(), status: "processing" }} />,
    );
    expect(container.innerHTML).toMatch(/motion-reduce:animate-none/);
  });
});

describe("VideoDetailSidebar", () => {
  it("switch autoplay labellisé", () => {
    render(
      <VideoDetailSidebar
        video={playableItem()}
        items={[playableItem()]}
        autoplayEnabled
        onAutoplayChange={() => {}}
        onOpenReport={() => {}}
      />,
    );

    const toggle = screen.getByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(toggle.getAttribute("aria-labelledby")).toBe("video-detail-autoplay-label");
    expect(document.getElementById("video-detail-autoplay-label")?.textContent).toBe(VIDEO_DETAIL_AUTOPLAY);
  });
});

describe("labels desktop — régression honnêteté", () => {
  it("constantes like/comment/share disponibles pour cartes split", () => {
    expect(VIDEO_DETAIL_LIKE.length).toBeGreaterThan(0);
    expect(VIDEO_DETAIL_COMMENT.length).toBeGreaterThan(0);
    expect(VIDEO_DETAIL_SHARE.length).toBeGreaterThan(0);
  });
});
