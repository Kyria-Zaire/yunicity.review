// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthorizedPublicationImageView } from "@/components/feed/authorized-publication-image";
import { FeedMobileMediaViewer } from "@/components/feed/mobile/feed-mobile-media-viewer";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import {
  AUTHORIZED_MEDIA_RETRY_LABEL,
  AUTHORIZED_MEDIA_UNAVAILABLE,
} from "@yunicity/utils";

const fetchAuthorizedMediaBlob = vi.fn();

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({ fetchAuthorizedMediaBlob }),
}));

afterEach(() => {
  cleanup();
  fetchAuthorizedMediaBlob.mockReset();
  vi.unstubAllGlobals();
});

describe("AuthorizedPublicationImageView", () => {
  it("n'émet pas de <img> avant ready", () => {
    const { container } = render(
      <AuthorizedPublicationImageView
        status="loading"
        objectUrl={null}
        alt="x"
        onRetry={() => undefined}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[data-authorized-media-state="loading"]')).not.toBeNull();
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
  it("chemin relatif → fetch API authentifié, pas de src relatif WEB", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    fetchAuthorizedMediaBlob.mockResolvedValue({
      blob: new Blob([bytes], { type: "image/jpeg" }),
      contentType: "image/jpeg",
    });
    const createObjectURL = vi.fn(() => "blob:authorized-1");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });

    render(<FeedPublicationMedia mediaUrl="/api/v1/story-media/u/a.jpg" label="Salut" />);

    const img = await screen.findByRole("img", { name: "Salut" });
    expect(img.getAttribute("src")).toBe("blob:authorized-1");
    expect(fetchAuthorizedMediaBlob).toHaveBeenCalledWith(
      "/api/v1/story-media/u/a.jpg",
      expect.any(AbortSignal),
    );
    expect(img.getAttribute("src")).not.toMatch(/^\/api\/v1\//);
    expect(img.getAttribute("src")).not.toContain("Bearer");
  });

  it("404 → état maîtrisé, pas d'img cassée", async () => {
    fetchAuthorizedMediaBlob.mockRejectedValue(new Error("not found"));
    render(<FeedPublicationMedia mediaUrl="/api/v1/story-media/u/missing.jpg" label="x" />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(AUTHORIZED_MEDIA_UNAVAILABLE);
    expect(
      document.querySelector('[data-feed-publication-media] img'),
    ).toBeNull();
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
        label="Plein écran"
      />,
    );
    expect(screen.getByRole("img", { name: "Plein écran" }).getAttribute("src")).toBe("blob:shared");
    expect(fetchAuthorizedMediaBlob).not.toHaveBeenCalled();
  });

  it("fermeture / réouverture : même src", async () => {
    const { rerender } = render(
      <FeedMobileMediaViewer
        open
        onOpenChange={() => undefined}
        objectUrl="blob:shared"
        label="Plein écran"
      />,
    );
    expect(screen.getByRole("img").getAttribute("src")).toBe("blob:shared");
    rerender(
      <FeedMobileMediaViewer
        open={false}
        onOpenChange={() => undefined}
        objectUrl="blob:shared"
        label="Plein écran"
      />,
    );
    await act(async () => undefined);
    rerender(
      <FeedMobileMediaViewer
        open
        onOpenChange={() => undefined}
        objectUrl="blob:shared"
        label="Plein écran"
      />,
    );
    expect(screen.getByRole("img", { name: "Plein écran" }).getAttribute("src")).toBe("blob:shared");
  });
});
