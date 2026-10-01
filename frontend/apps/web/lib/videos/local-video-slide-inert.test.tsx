// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import { LOCAL_VIDEO_REPORT_LABEL } from "@yunicity/utils";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoFeedViewport } from "@/components/videos/local-video-feed-viewport";
import { LocalVideoSlide } from "@/components/videos/local-video-slide";

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

const { mockActiveId } = vi.hoisted(() => ({
  mockActiveId: { value: "v-active" as string | null },
}));

vi.mock("@/hooks/use-video-feed-autoplay", () => ({
  useVideoFeedAutoplay: () => mockActiveId.value,
}));

vi.stubGlobal(
  "fetch",
  vi.fn(() => {
    throw new Error("Requête réseau interdite dans ce test");
  }),
);

function playableItem(id = "v-report"): LocalVideoFeedItem {
  return {
    id,
    author_user_id: "u1",
    author: {
      id: "u1",
      username: "citoyen",
      full_name: "Citoyen Test",
      avatar_url: null,
    },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "moment",
    title: "Vidéo signalable",
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

function slideArticle(id: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-video-slide-id="${id}"]`);
  if (!element) throw new Error(`Slide ${id} introuvable`);
  return element;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockActiveId.value = "v-active";
});

describe("LocalVideoSlide — inert slides", () => {
  it("slide active : pas d'inert ni aria-hidden", () => {
    render(
      <LocalVideoSlide
        item={playableItem("v-active")}
        isActive
        onOpenComments={() => {}}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
      />,
    );

    const article = slideArticle("v-active");
    expect(article.inert).toBe(false);
    expect(article.getAttribute("aria-hidden")).toBeNull();
    expect(screen.getByRole("button", { name: "Aimer la vidéo" })).not.toBeNull();
  });

  it("slide inactive : inert et aria-hidden, commandes hors arbre accessible", () => {
    render(
      <LocalVideoSlide
        item={playableItem("v-inactive")}
        isActive={false}
        onOpenComments={() => {}}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
      />,
    );

    const article = slideArticle("v-inactive");
    expect(article.inert).toBe(true);
    expect(article.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("button", { name: LOCAL_VIDEO_REPORT_LABEL })).toBeNull();
    expect(screen.queryByRole("button", { name: "Aimer la vidéo" })).toBeNull();
  });

  it("bascule isActive : inert permute entre les slides", () => {
    const { rerender } = render(
      <LocalVideoSlide
        item={playableItem("v-toggle")}
        isActive={false}
        onOpenComments={() => {}}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
      />,
    );

    expect(slideArticle("v-toggle").inert).toBe(true);

    rerender(
      <LocalVideoSlide
        item={playableItem("v-toggle")}
        isActive
        onOpenComments={() => {}}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
      />,
    );

    expect(slideArticle("v-toggle").inert).toBe(false);
    expect(screen.getByRole("button", { name: "Aimer la vidéo" })).not.toBeNull();
  });
});

describe("LocalVideoFeedViewport — une seule slide interactive", () => {
  it("seule la slide active expose ses commandes dans le parcours clavier", () => {
    mockActiveId.value = "v-one";

    render(
      <LocalVideoFeedViewport
        items={[playableItem("v-one"), playableItem("v-two")]}
        onActiveVideoChange={() => {}}
        onOpenComments={() => {}}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
      />,
    );

    expect(slideArticle("v-one").inert).toBe(false);
    expect(slideArticle("v-two").inert).toBe(true);
    expect(screen.getByRole("button", { name: "Aimer la vidéo" })).not.toBeNull();
    expect(screen.queryAllByRole("button", { name: "Aimer la vidéo" })).toHaveLength(1);
  });

  it("changement activeId : inert bascule sans second lecteur actif", () => {
    mockActiveId.value = "v-one";

    const { rerender } = render(
      <LocalVideoFeedViewport
        items={[playableItem("v-one"), playableItem("v-two")]}
        onActiveVideoChange={() => {}}
        onOpenComments={() => {}}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
      />,
    );

    mockActiveId.value = "v-two";
    rerender(
      <LocalVideoFeedViewport
        items={[playableItem("v-one"), playableItem("v-two")]}
        onActiveVideoChange={() => {}}
        onOpenComments={() => {}}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={() => {}}
      />,
    );

    expect(slideArticle("v-one").inert).toBe(true);
    expect(slideArticle("v-two").inert).toBe(false);

    const playing = Array.from(document.querySelectorAll("video")).filter(
      (video) => !video.paused,
    );
    expect(playing).toHaveLength(0);
  });
});

describe("LocalVideoActionRail — action Signaler", () => {
  it("expose un bouton accessible Signaler qui appelle onReportClick une fois", () => {
    const onReportClick = vi.fn();

    render(
      <LocalVideoActionRail
        item={playableItem()}
        likeCount={0}
        commentCount={0}
        likedByMe={false}
        onLikeClick={() => {}}
        onCommentsClick={() => {}}
        onShareClick={() => {}}
        onReportClick={onReportClick}
      />,
    );

    const reportButton = screen.getByRole("button", { name: LOCAL_VIDEO_REPORT_LABEL });
    fireEvent.click(reportButton);

    expect(onReportClick).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("LocalVideoSlide — relais onOpenReport (slide active)", () => {
  it("relaye le clic Signaler vers onOpenReport quand la slide est active", () => {
    const onOpenReport = vi.fn();

    render(
      <LocalVideoSlide
        item={playableItem()}
        isActive
        onOpenComments={() => {}}
        onToggleLike={() => {}}
        onShare={() => {}}
        onOpenReport={onOpenReport}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: LOCAL_VIDEO_REPORT_LABEL }));
    expect(onOpenReport).toHaveBeenCalledTimes(1);
  });
});
