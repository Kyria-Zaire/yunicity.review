// @vitest-environment jsdom

import type { StoryItem } from "@yunicity/types";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetAuthorizedMediaSessionForTests } from "@yunicity/utils";

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
  /**
   * Purge la session média entre deux tests (MEDIA-MULTI-PHOTO-01).
   *
   * Depuis que l'application CONSERVE le Blob d'un média dans la session
   * autorisée, un test lirait sinon celui que le precedent a obtenu : ni
   * `createObjectURL` ni la requete ne repartiraient, et l'assertion
   * porterait sur l'etat laisse par le voisin. Meme convention que les tests
   * du fil.
   */
  __resetAuthorizedMediaSessionForTests();
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

  it("au démontage, relâche sa part — et le Blob part avec la session", async () => {
    /**
     * ⚠️ COMPORTEMENT CHANGÉ par MEDIA-MULTI-PHOTO-01, et assumé.
     *
     * Le démontage ne RÉVOQUE plus à lui seul : la session autorisée conserve
     * le Blob pour pouvoir le resservir sans repayer le transfert — la route
     * étant `no-store`, c'est le seul endroit où la réutilisation peut vivre.
     * Le composant relâche sa part, le cache garde la sienne.
     *
     * Ce que ce test verrouille reste donc l'absence de fuite : à la purge de
     * session — déconnexion, changement de compte, 401 — le Blob EST révoqué,
     * exactement une fois.
     */
    const view = render(<StoryCard story={story()} city="Reims" />);
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledOnce());

    view.unmount();

    __resetAuthorizedMediaSessionForTests();
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
