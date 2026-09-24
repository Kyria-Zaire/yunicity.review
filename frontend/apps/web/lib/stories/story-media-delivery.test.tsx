// @vitest-environment jsdom

import type { StoryItem } from "@yunicity/types";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StoryCard } from "@/components/stories/story-card";
import { AuthorizedStoryMedia } from "@/components/stories/authorized-story-media";

const STORY_MEDIA =
  "/api/v1/story-media/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg";
const STORY_VIDEO = STORY_MEDIA.replace(/\.jpg$/i, ".mp4");

const mockApi = vi.hoisted(() => ({
  fetchAuthorizedMediaBlob: vi.fn(),
  recordStoryView: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/hooks/use-yunicity-api", () => ({ useYunicityApi: () => mockApi }));

function story(mediaUrl = STORY_MEDIA): StoryItem {
  return {
    id: "story-1",
    author: {
      type: "citizen",
      id: "author-1",
      username: "alice",
      display_name: "Alice",
      logo_url: null,
    },
    caption: "Une story",
    media_url: mediaUrl,
    location_label: "Reims",
    category_ids: [],
    category_labels: [],
    view_count: 1,
    like_count: 0,
    liked_by_me: false,
    created_at: "2026-09-24T08:00:00Z",
    expires_at: null,
    is_recent: true,
    city: "Reims",
  };
}

beforeEach(() => {
  sessionStorage.clear();
  mockApi.fetchAuthorizedMediaBlob.mockReset();
  mockApi.fetchAuthorizedMediaBlob.mockResolvedValue({
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" }),
    contentType: "image/jpeg",
  });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:story-authenticated");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Story media delivery", () => {
  it("charge l'image Story via le client authentifié au lieu de l'origine Web", async () => {
    const { container } = render(<StoryCard story={story()} city="Reims" />);

    await waitFor(() => expect(mockApi.fetchAuthorizedMediaBlob).toHaveBeenCalledOnce());
    expect(mockApi.fetchAuthorizedMediaBlob).toHaveBeenCalledWith(STORY_MEDIA, expect.any(AbortSignal));
    expect(container.querySelector(`img[src="${STORY_MEDIA}"]`)).toBeNull();
    await waitFor(() =>
      expect(container.querySelector('img[src="blob:story-authenticated"]')).not.toBeNull(),
    );
  });

  it("charge la vidéo par Blob, sans autoplay, et la rend lisible", async () => {
    mockApi.fetchAuthorizedMediaBlob.mockResolvedValue({
      blob: new Blob([new Uint8Array([1, 2, 3])], { type: "video/mp4" }),
      contentType: "video/mp4",
    });
    const { container } = render(<StoryCard story={story(STORY_VIDEO)} city="Reims" />);

    await waitFor(() => expect(mockApi.fetchAuthorizedMediaBlob).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(container.querySelector('video[src="blob:story-authenticated"]')).not.toBeNull(),
    );
    const video = container.querySelector('video[src="blob:story-authenticated"]');
    expect(video).not.toBeNull();
    expect(video?.hasAttribute("autoplay")).toBe(false);
    expect(video).toHaveProperty("controls", true);
    expect(video).toHaveProperty("muted", true);
    fireEvent.loadedData(video as HTMLVideoElement);
    expect(video?.getAttribute("data-story-media-state")).toBe("ready");
  });

  it("révoque l'object URL au démontage", async () => {
    const view = render(<StoryCard story={story()} city="Reims" />);
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledOnce());
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:story-authenticated");
  });

  it("affiche une erreur hermétique et permet une nouvelle tentative", async () => {
    mockApi.fetchAuthorizedMediaBlob
      .mockRejectedValueOnce(new Error("404"))
      .mockResolvedValueOnce({
        blob: new Blob([new Uint8Array([1])], { type: "image/jpeg" }),
        contentType: "image/jpeg",
      });
    render(<StoryCard story={story()} city="Reims" />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/indisponible/i);
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    await waitFor(() => expect(mockApi.fetchAuthorizedMediaBlob).toHaveBeenCalledTimes(2));
  });

  it("gère un média absent sans requête ni URL reconstruite", () => {
    render(<AuthorizedStoryMedia mediaUrl={null} alt="" className="h-full w-full" />);
    expect(screen.getByRole("alert").getAttribute("data-story-media-state")).toBe("missing");
    expect(mockApi.fetchAuthorizedMediaBlob).not.toHaveBeenCalled();
  });
});
