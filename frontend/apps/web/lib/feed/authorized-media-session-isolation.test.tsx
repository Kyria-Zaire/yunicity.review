// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeedMediaViewerHost } from "@/components/feed/feed-media-viewer-host";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import {
  __resetFeedMediaViewerSessionForTests,
  getFeedMediaViewerSession,
  openFeedMediaViewer,
} from "@/lib/feed/feed-media-viewer-session";
import {
  __authorizedMediaRegistrySizeForTests,
  __authorizedObjectUrlRetainCountForTests,
  __resetAuthorizedMediaSessionForTests,
  beginAuthorizedMediaFetch,
  clearAuthorizedMediaSession,
  getAuthorizedMediaEpoch,
  onAuthorizedMediaSessionClear,
  releaseAuthorizedObjectUrl,
  retainAuthorizedObjectUrl,
} from "@yunicity/utils";

const VALID_MEDIA =
  "/api/v1/story-media/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg";

const { fetchAuthorizedMediaBlob, apiStub } = vi.hoisted(() => {
  const fetchAuthorizedMediaBlob = vi.fn();
  return {
    fetchAuthorizedMediaBlob,
    apiStub: { fetchAuthorizedMediaBlob },
  };
});

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => apiStub,
}));

const pathnameState = vi.hoisted(() => ({ value: "/feed" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

afterEach(() => {
  cleanup();
  fetchAuthorizedMediaBlob.mockReset();
  __resetFeedMediaViewerSessionForTests();
  __resetAuthorizedMediaSessionForTests();
  pathnameState.value = "/feed";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("MEDIA-01B session isolation — viewer + purge", () => {
  it("clear ferme la visionneuse et vide le registre", () => {
    const revoke = vi.fn();
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(revoke);
    const shared = "blob:viewer-clear";
    retainAuthorizedObjectUrl(shared);
    render(<FeedMediaViewerHost />);
    openFeedMediaViewer({
      mediaUrl: VALID_MEDIA,
      objectUrl: shared,
      label: "Plein écran",
    });
    expect(getFeedMediaViewerSession().open).toBe(true);
    clearAuthorizedMediaSession();
    expect(getFeedMediaViewerSession().open).toBe(false);
    expect(getFeedMediaViewerSession().objectUrl).toBeNull();
    expect(getFeedMediaViewerSession().mediaUrl).toBe("");
    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);
    expect(document.querySelector(`img[src="${shared}"]`)).toBeNull();
  });

  it("navigation change pathname → ferme le viewer sans tout purger", () => {
    const shared = "blob:nav-viewer";
    retainAuthorizedObjectUrl(shared);
    const { rerender } = render(<FeedMediaViewerHost />);
    openFeedMediaViewer({
      mediaUrl: VALID_MEDIA,
      objectUrl: shared,
      label: "Plein écran",
    });
    expect(getFeedMediaViewerSession().open).toBe(true);
    pathnameState.value = "/settings";
    rerender(<FeedMediaViewerHost />);
    expect(getFeedMediaViewerSession().open).toBe(false);
  });

  it("fetch A après logout (epoch++) n'enregistre aucune object URL", async () => {
    let resolveFetch!: (value: { blob: Blob; contentType: string }) => void;
    fetchAuthorizedMediaBlob.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const createCalls: string[] = [];
    const revokeCalls: string[] = [];
    const realCreate = URL.createObjectURL.bind(URL);
    const realRevoke = URL.revokeObjectURL.bind(URL);
    vi.spyOn(URL, "createObjectURL").mockImplementation((obj: Blob | MediaSource) => {
      const url = realCreate(obj);
      createCalls.push(url);
      return url;
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation((url: string) => {
      revokeCalls.push(url);
      realRevoke(url);
    });

    render(<FeedPublicationMedia mediaUrl={VALID_MEDIA} label="A" />);
    await waitFor(() => expect(fetchAuthorizedMediaBlob).toHaveBeenCalled());

    const epochBefore = getAuthorizedMediaEpoch();
    clearAuthorizedMediaSession();
    expect(getAuthorizedMediaEpoch()).toBe(epochBefore + 1);

    await act(async () => {
      resolveFetch({
        blob: new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }),
        contentType: "image/jpeg",
      });
    });
    await act(async () => undefined);

    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);
    expect(screen.queryByRole("img", { name: "A" })).toBeNull();
    expect(revokeCalls.length).toBeGreaterThanOrEqual(createCalls.length);
  });

  it("switch epoch A→B : aucune object URL de A réutilisée", async () => {
    const blobA = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });
    fetchAuthorizedMediaBlob.mockResolvedValue({ blob: blobA, contentType: "image/jpeg" });

    const { container, unmount } = render(
      <FeedPublicationMedia mediaUrl={VALID_MEDIA} label="UserA" />,
    );
    await waitFor(() => {
      expect(
        container.querySelector('[data-authorized-media-state="decoding"] img'),
      ).not.toBeNull();
    });
    const imgA = container.querySelector(
      '[data-authorized-media-state="decoding"] img',
    ) as HTMLImageElement;
    const srcA = imgA.getAttribute("src");
    expect(srcA).toMatch(/^blob:/);
    await act(async () => {
      fireEvent.load(imgA);
    });

    clearAuthorizedMediaSession();
    unmount();
    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);

    const blobB = new Blob([new Uint8Array([4, 5, 6])], { type: "image/jpeg" });
    fetchAuthorizedMediaBlob.mockResolvedValue({ blob: blobB, contentType: "image/jpeg" });
    const second = render(<FeedPublicationMedia mediaUrl={VALID_MEDIA} label="UserB" />);
    await waitFor(() => {
      expect(
        second.container.querySelector('[data-authorized-media-state="decoding"] img'),
      ).not.toBeNull();
    });
    const imgB = second.container.querySelector(
      '[data-authorized-media-state="decoding"] img',
    ) as HTMLImageElement;
    expect(imgB.getAttribute("src")).toMatch(/^blob:/);
    expect(imgB.getAttribute("src")).not.toBe(srcA);
    expect(String(fetchAuthorizedMediaBlob.mock.calls.at(-1)?.[0])).not.toMatch(/Bearer|token=/i);
  });

  it("double cleanup Strict Mode : pas d'exception, registre cohérent", () => {
    expect(() => {
      const h1 = beginAuthorizedMediaFetch();
      const h2 = beginAuthorizedMediaFetch();
      retainAuthorizedObjectUrl("blob:sm");
      h1.finish();
      h2.finish();
      releaseAuthorizedObjectUrl("blob:sm");
      releaseAuthorizedObjectUrl("blob:sm");
      clearAuthorizedMediaSession();
      clearAuthorizedMediaSession();
    }).not.toThrow();
    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);
  });
});

describe("MEDIA-01B — AuthProvider purge centrale", () => {
  it("onSessionCleared purge médias avant d'effacer l'utilisateur", () => {
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    retainAuthorizedObjectUrl("blob:auth-clear");
    openFeedMediaViewer({
      mediaUrl: VALID_MEDIA,
      objectUrl: "blob:auth-clear",
      label: "x",
    });

    expect(() => clearAuthorizedMediaSession()).not.toThrow();
    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);
    expect(getFeedMediaViewerSession().open).toBe(false);
  });

  it("une exception de purge ne doit pas empêcher clearAuthorizedMediaSession de finir", () => {
    const unsub = onAuthorizedMediaSessionClear(() => {
      throw new Error("boom");
    });
    retainAuthorizedObjectUrl("blob:e");
    expect(() => clearAuthorizedMediaSession()).not.toThrow();
    expect(__authorizedMediaRegistrySizeForTests()).toBe(0);
    unsub();
  });
});
