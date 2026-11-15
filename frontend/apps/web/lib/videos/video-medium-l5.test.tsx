// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import { LOCAL_VIDEO_SHARED_BADGE, reorderLocalVideoFeedForFocus } from "@yunicity/utils";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VideosMediumVerticalFeed } from "@/components/videos/medium/videos-medium-vertical-feed";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/components/videos/local-video-feed-viewport", () => ({
  LocalVideoFeedViewport: ({
    items,
    focusVideoId,
    presentation,
    mediumNav,
    onToggleMute,
  }: {
    items: LocalVideoFeedItem[];
    focusVideoId?: string | null;
    presentation?: string;
    mediumNav?: {
      onPrevious: () => void;
      onNext: () => void;
      canPrevious: boolean;
      canNext: boolean;
    } | null;
    onToggleMute?: () => void;
  }) => (
    <div
      data-testid="medium-feed-viewport"
      data-focus={focusVideoId ?? ""}
      data-ids={items.map((item) => item.id).join(",")}
      data-presentation={presentation ?? ""}
      data-medium-side-column=""
      data-has-mute={onToggleMute ? "1" : ""}
    >
      {mediumNav ? (
        <div data-videos-medium-side-column="">
          <button
            type="button"
            aria-label="Vidéo précédente"
            disabled={!mediumNav.canPrevious}
            onClick={mediumNav.onPrevious}
          />
          <button
            type="button"
            aria-label="Vidéo suivante"
            disabled={!mediumNav.canNext}
            onClick={mediumNav.onNext}
          />
        </div>
      ) : null}
    </div>
  ),
}));

vi.mock("@/components/videos/local-video-description-sheet", () => ({
  LocalVideoDescriptionSheet: () => null,
}));
vi.mock("@/components/videos/local-video-more-menu", () => ({
  LocalVideoMoreMenu: () => null,
}));
vi.mock("@/components/videos/video-comments-sheet", () => ({
  VideoCommentsSheet: () => null,
}));
vi.mock("@/lib/videos/active-report-video-context", () => ({
  useActiveReportVideoId: () => null,
}));

function item(id: string): LocalVideoFeedItem {
  return {
    id,
    author_user_id: "u1",
    author: { id: "u1", username: "a", full_name: "A", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "quartier",
    title: `T-${id}`,
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
    status: "published",
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

afterEach(() => {
  cleanup();
});

describe("VIDEO-REFONTE-L5-MEDIUM-01 — fil vertical", () => {
  it("place ?video= en tête sans doublon", () => {
    const items = [item("a"), item("b"), item("c")];
    expect(reorderLocalVideoFeedForFocus(items, "b").map((v) => v.id)).toEqual(["b", "a", "c"]);
    render(
      <VideosMediumVerticalFeed
        items={items}
        focusVideoId="b"
        sharedEntry
        onToggleLike={vi.fn()}
        onShare={vi.fn()}
        onOpenReport={vi.fn()}
        onCommentCountDelta={vi.fn()}
      />,
    );
    const viewport = screen.getByTestId("medium-feed-viewport");
    expect(viewport.getAttribute("data-ids")).toBe("b,a,c");
    expect(viewport.getAttribute("data-focus")).toBe("b");
    expect(viewport.getAttribute("data-presentation")).toBe("medium");
    expect(document.querySelector("[data-videos-medium-side-column]")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(LOCAL_VIDEO_SHARED_BADGE);
  });

  it("arrivée /videos : ordre inchangé, pas de badge partagé", () => {
    const items = [item("a"), item("b")];
    render(
      <VideosMediumVerticalFeed
        items={items}
        onToggleLike={vi.fn()}
        onShare={vi.fn()}
        onOpenReport={vi.fn()}
        onCommentCountDelta={vi.fn()}
      />,
    );
    const viewport = screen.getByTestId("medium-feed-viewport");
    expect(viewport.getAttribute("data-ids")).toBe("a,b");
    expect(viewport.getAttribute("data-presentation")).toBe("medium");
    expect(screen.queryByText(LOCAL_VIDEO_SHARED_BADGE)).toBeNull();
    // Son : dans le cadre vidéo (slide), plus dans une toolbar isolée.
    expect(screen.queryByRole("button", { name: "Activer le son" })).toBeNull();
    expect(
      (screen.getByRole("button", { name: "Vidéo précédente" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Vidéo suivante" }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("expose le marqueur data-videos-medium-vertical-feed", () => {
    render(
      <VideosMediumVerticalFeed
        items={[item("a")]}
        onToggleLike={vi.fn()}
        onShare={vi.fn()}
        onOpenReport={vi.fn()}
        onCommentCountDelta={vi.fn()}
      />,
    );
    expect(document.querySelector("[data-videos-medium-vertical-feed]")).toBeTruthy();
  });
});
