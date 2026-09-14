// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthorizedPublicationImageView } from "@/components/feed/authorized-publication-image";
import { FeedMediaViewerHost } from "@/components/feed/feed-media-viewer-host";
import { FeedMobileMediaViewer } from "@/components/feed/mobile/feed-mobile-media-viewer";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import {
  __resetFeedMediaViewerSessionForTests,
  getFeedMediaViewerSession,
  openFeedMediaViewer,
} from "@/lib/feed/feed-media-viewer-session";
import {
  AUTHORIZED_MEDIA_RETRY_LABEL,
  AUTHORIZED_MEDIA_UNAVAILABLE,
  __authorizedObjectUrlRetainCountForTests,
  __resetAuthorizedMediaSessionForTests,
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

afterEach(() => {
  cleanup();
  fetchAuthorizedMediaBlob.mockReset();
  __resetFeedMediaViewerSessionForTests();
  __resetAuthorizedMediaSessionForTests();
});

async function waitDecodingImg(container: HTMLElement): Promise<HTMLImageElement> {
  await waitFor(() => {
    expect(
      container.querySelector('[data-authorized-media-state="decoding"] img'),
    ).not.toBeNull();
  });
  return container.querySelector(
    '[data-authorized-media-state="decoding"] img',
  ) as HTMLImageElement;
}

describe("AuthorizedPublicationImageView", () => {
  it("n'expose pas d'img visible avant ready", () => {
    const { container } = render(
      <AuthorizedPublicationImageView
        status="loading"
        objectUrl={null}
        alt="x"
        onRetry={() => undefined}
      />,
    );
    expect(container.querySelector('[data-authorized-media-state="loading"]')).not.toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("decoding : img masquée jusqu'à onLoad", async () => {
    const onDisplayed = vi.fn();
    const { container } = render(
      <AuthorizedPublicationImageView
        status="decoding"
        objectUrl="blob:decoding-1"
        alt="Photo"
        onRetry={() => undefined}
        onDisplayed={onDisplayed}
      />,
    );
    expect(screen.queryByRole("img", { name: "Photo" })).toBeNull();
    const hidden = container.querySelector("img");
    expect(hidden?.getAttribute("aria-hidden")).toBe("true");
    await act(async () => {
      fireEvent.load(hidden!);
    });
    expect(onDisplayed).toHaveBeenCalledOnce();
  });

  it("onError en decoding → callback d'échec, pas ready", async () => {
    const onDecodeFailed = vi.fn();
    const { container } = render(
      <AuthorizedPublicationImageView
        status="decoding"
        objectUrl="blob:bad"
        alt="Photo"
        onRetry={() => undefined}
        onDecodeFailed={onDecodeFailed}
      />,
    );
    await act(async () => {
      fireEvent.error(container.querySelector("img")!);
    });
    expect(onDecodeFailed).toHaveBeenCalledOnce();
  });

  it("affiche l'état d'erreur borné + retry", async () => {
    const onRetry = vi.fn();
    render(
      <AuthorizedPublicationImageView
        status="error"
        objectUrl={null}
        alt="x"
        onRetry={onRetry}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain(AUTHORIZED_MEDIA_UNAVAILABLE);
    await userEvent.click(screen.getByRole("button", { name: AUTHORIZED_MEDIA_RETRY_LABEL }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("ready : img sur object URL uniquement", () => {
    render(
      <AuthorizedPublicationImageView
        status="ready"
        objectUrl="blob:local-ready"
        alt="Photo"
        onRetry={() => undefined}
      />,
    );
    const img = screen.getByRole("img", { name: "Photo" });
    expect(img.getAttribute("src")).toBe("blob:local-ready");
  });
});

describe("FeedPublicationMedia — MEDIA-01B", () => {
  it("chemin relatif → fetch API authentifié, ready uniquement après onLoad", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    const blob = new Blob([bytes], { type: "image/jpeg" });
    fetchAuthorizedMediaBlob.mockResolvedValue({ blob, contentType: "image/jpeg" });

    const { container } = render(
      <FeedPublicationMedia mediaUrl={VALID_MEDIA} label="Salut" />,
    );

    const hidden = await waitDecodingImg(container);
    expect(screen.queryByRole("img", { name: "Salut" })).toBeNull();
    expect(hidden.getAttribute("src")).toMatch(/^blob:/);
    expect(hidden.getAttribute("src")).not.toMatch(/^\/api\/v1\//);
    expect(hidden.getAttribute("src")).not.toContain("Bearer");

    await act(async () => {
      fireEvent.load(hidden);
    });

    const img = await screen.findByRole("img", { name: "Salut" });
    expect(img.getAttribute("src")).toMatch(/^blob:/);
    expect(fetchAuthorizedMediaBlob).toHaveBeenCalledWith(VALID_MEDIA, expect.any(AbortSignal));
  });

  it("Blob JPEG invalide → onError → erreur contrôlée, jamais ready", async () => {
    const blob = new Blob([new Uint8Array([0x00, 0x01])], { type: "image/jpeg" });
    fetchAuthorizedMediaBlob.mockResolvedValue({ blob, contentType: "image/jpeg" });

    const { container } = render(
      <FeedPublicationMedia mediaUrl={VALID_MEDIA} label="x" />,
    );
    const hidden = await waitDecodingImg(container);
    await act(async () => {
      fireEvent.error(hidden);
    });
    expect(await screen.findByText(AUTHORIZED_MEDIA_UNAVAILABLE)).toBeTruthy();
    expect(screen.queryByRole("img", { name: "x" })).toBeNull();
  });

  it("404 → état maîtrisé, pas d'img cassée", async () => {
    fetchAuthorizedMediaBlob.mockRejectedValue(new Error("not found"));
    render(<FeedPublicationMedia mediaUrl={VALID_MEDIA} label="x" />);
    expect(await screen.findByText(AUTHORIZED_MEDIA_UNAVAILABLE)).toBeTruthy();
    expect(document.querySelector("[data-feed-publication-media] img")).toBeNull();
  });
});

describe("FeedMobileMediaViewer — partage de source", () => {
  it("réutilise l'objectUrl fourni sans second fetch", async () => {
    fetchAuthorizedMediaBlob.mockClear();
    render(
      <FeedMobileMediaViewer
        open
        onOpenChange={() => undefined}
        objectUrl="blob:shared"
        mediaUrl={VALID_MEDIA}
        label="Plein écran"
      />,
    );
    expect(screen.getByRole("img", { name: "Plein écran" }).getAttribute("src")).toBe(
      "blob:shared",
    );
    expect(fetchAuthorizedMediaBlob).not.toHaveBeenCalled();
  });

  it("fermeture / réouverture : même src", async () => {
    const { rerender } = render(
      <FeedMobileMediaViewer
        open
        onOpenChange={() => undefined}
        objectUrl="blob:shared"
        mediaUrl={VALID_MEDIA}
        label="Plein écran"
      />,
    );
    expect(screen.getByRole("img").getAttribute("src")).toBe("blob:shared");
    rerender(
      <FeedMobileMediaViewer
        open={false}
        onOpenChange={() => undefined}
        objectUrl="blob:shared"
        mediaUrl={VALID_MEDIA}
        label="Plein écran"
      />,
    );
    await act(async () => undefined);
    rerender(
      <FeedMobileMediaViewer
        open
        onOpenChange={() => undefined}
        objectUrl="blob:shared"
        mediaUrl={VALID_MEDIA}
        label="Plein écran"
      />,
    );
    expect(screen.getByRole("img", { name: "Plein écran" }).getAttribute("src")).toBe(
      "blob:shared",
    );
  });
});

describe("Viewer ownership — carte démontée", () => {
  it("session racine conserve l'object URL après démontage du host temporaire", () => {
    const shared = "blob:owned-by-viewer";
    retainAuthorizedObjectUrl(shared);

    const { unmount } = render(<FeedMediaViewerHost />);
    openFeedMediaViewer({
      mediaUrl: VALID_MEDIA,
      objectUrl: shared,
      label: "Plein écran",
    });
    expect(getFeedMediaViewerSession().open).toBe(true);
    expect(getFeedMediaViewerSession().objectUrl).toBe(shared);
    unmount();

    // Session module survit au démontage React de la carte/host.
    expect(getFeedMediaViewerSession().open).toBe(true);
    expect(getFeedMediaViewerSession().objectUrl).toBe(shared);
    expect(__authorizedObjectUrlRetainCountForTests(shared)).toBeGreaterThan(0);

    render(<FeedMediaViewerHost />);
    // Le host relit la session ; l'img peut être dans un portail Dialog.
    expect(getFeedMediaViewerSession().objectUrl).toBe(shared);
    expect(
      document.querySelector('img[src="blob:owned-by-viewer"]') ??
        document.querySelector('img[alt="Plein écran"]'),
    ).not.toBeNull();

    releaseAuthorizedObjectUrl(shared);
  });
});
