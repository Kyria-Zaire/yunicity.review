// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalVideoShareFeedback } from "@/components/videos/local-video-share-feedback";
import { useLocalVideoInteractions } from "@/hooks/use-local-video-interactions";
import { LocalVideoShareFeedbackProvider } from "@/lib/videos/local-video-share-feedback-context";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({
    likeLocalVideo: vi.fn(),
    unlikeLocalVideo: vi.fn(),
    reportLocalVideo: vi.fn(),
  }),
}));

vi.mock("@yunicity/ui/primitives", () => ({
  Drawer: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

function item(): LocalVideoFeedItem {
  return {
    id: "v1",
    author_user_id: "u1",
    author: { id: "u1", username: "a", full_name: "A", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "quartier",
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

function FeedLikeHarness() {
  const interactions = useLocalVideoInteractions({ updateItem: () => {} });
  return (
    <div>
      <button type="button" onClick={() => void interactions.shareVideo(item())}>
        Partager
      </button>
      {interactions.shareHint ? (
        <p data-testid="legacy-share-hint">{interactions.shareHint}</p>
      ) : null}
    </div>
  );
}

function VideosHarness() {
  const interactions = useLocalVideoInteractions({ updateItem: () => {} });
  return (
    <div>
      <button type="button" onClick={() => void interactions.shareVideo(item())}>
        Partager
      </button>
      {interactions.shareHint ? (
        <p data-testid="legacy-share-hint">{interactions.shareHint}</p>
      ) : null}
      <LocalVideoShareFeedback
        onCopyFromFailed={() => void interactions.copyShareLinkFromFailed()}
      />
    </div>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("VIDEO-REFONTE-L2 — repli fil accueil hors Provider", () => {
  it("sans Provider : copie réussie restaure le hint « Lien copié » (comportement antérieur)", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", {
      share: undefined,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<FeedLikeHarness />);
    await act(async () => {
      screen.getByRole("button", { name: "Partager" }).click();
    });
    expect(screen.getByTestId("legacy-share-hint").textContent).toBe("Lien copié");
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByTestId("legacy-share-hint")).toBeNull();
  });

  it("sans Provider : failed / unavailable restent silencieux (pas de H2/H3 sur l'accueil)", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new DOMException("x", "NotAllowedError")),
      clipboard: { writeText: vi.fn() },
    });
    render(<FeedLikeHarness />);
    await act(async () => {
      screen.getByRole("button", { name: "Partager" }).click();
    });
    await waitFor(() => {
      expect(screen.queryByTestId("legacy-share-hint")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("avec Provider /videos : pas de hint local, H1 centralisé après copie (pas de doublon)", async () => {
    vi.stubGlobal("navigator", {
      share: undefined,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(
      <LocalVideoShareFeedbackProvider>
        <VideosHarness />
      </LocalVideoShareFeedbackProvider>,
    );
    await act(async () => {
      screen.getByRole("button", { name: "Partager" }).click();
    });
    await waitFor(() => {
      expect(screen.queryByTestId("legacy-share-hint")).toBeNull();
      expect(screen.getByRole("status").textContent).toContain("Lien copié");
    });
  });
});
