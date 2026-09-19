// @vitest-environment jsdom

import type { LocalVideoFeedItem } from "@yunicity/types";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";

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

const mockApi = vi.hoisted(() => ({
  listLocalVideoComments: vi.fn().mockResolvedValue({ items: [] }),
  createLocalVideoComment: vi.fn(),
  deleteLocalVideoComment: vi.fn(),
}));

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => mockApi,
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

function feedItem(): LocalVideoFeedItem {
  return {
    id: "v-comments",
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
    duration_seconds: 12,
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

const COMMENTS_VIDEO = feedItem();

function CommentsHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Ouvrir les commentaires
      </button>
      <main id="app-main" data-testid="app-main">
        Contenu feed
      </main>
      <VideoCommentsSheet
        open={open}
        video={COMMENTS_VIDEO}
        onClose={() => setOpen(false)}
        returnFocusRef={triggerRef}
      />
    </>
  );
}

function dialog(): HTMLElement {
  return screen.getByRole("dialog", { name: "Commentaires" });
}

function focusablesInDialog(): HTMLElement[] {
  return Array.from(
    dialog().querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ),
  );
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("VideoCommentsSheet — modal Drawer", () => {
  it("ouverture : focus dans le dialogue et arrière-plan inert", async () => {
    render(<CommentsHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir les commentaires" }));

    await waitFor(() => {
      expect(dialog()).toBeTruthy();
    });

    const appMain = screen.getByTestId("app-main");
    const inertAncestor = appMain.closest("[inert]");
    expect(inertAncestor !== null || appMain.hasAttribute("inert")).toBe(true);

    expect(dialog().contains(document.activeElement)).toBe(true);
  });

  it("Tab sur le dernier contrôle revient au premier", async () => {
    render(<CommentsHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir les commentaires" }));

    await waitFor(() => {
      expect(dialog()).toBeTruthy();
    });

    const items = focusablesInDialog();
    expect(items.length).toBeGreaterThan(1);
    items.at(-1)?.focus();

    fireEvent.keyDown(document, { key: "Tab", bubbles: true, cancelable: true });

    await waitFor(() => {
      expect(items[0]?.contains(document.activeElement) || document.activeElement === items[0]).toBe(
        true,
      );
    });
  });

  it("Shift+Tab sur le premier contrôle revient au dernier", async () => {
    render(<CommentsHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir les commentaires" }));

    await waitFor(() => {
      expect(dialog()).toBeTruthy();
    });

    const items = focusablesInDialog();
    items[0]?.focus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });

    await waitFor(() => {
      const last = items.at(-1);
      expect(last?.contains(document.activeElement) || document.activeElement === last).toBe(true);
    });
  });

  it("Escape ferme et rend le focus au déclencheur", async () => {
    render(<CommentsHarness />);
    const trigger = screen.getByRole("button", { name: "Ouvrir les commentaires" });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(dialog()).toBeTruthy();
    });

    fireEvent.keyDown(document, { key: "Escape", bubbles: true, cancelable: true });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Commentaires" })).toBeNull();
    });

    expect(document.activeElement).toBe(trigger);
  });
});
