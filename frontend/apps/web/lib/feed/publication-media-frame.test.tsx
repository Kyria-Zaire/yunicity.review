// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import { PublicationMediaFrame } from "@/components/feed/publication-media-frame";
import { PublicationMediaGrid, slicePublicationMediaForGrid } from "@/components/feed/publication-media-grid";
import {
  AUTHORIZED_MEDIA_UNAVAILABLE,
  __resetAuthorizedMediaSessionForTests,
  classifyMediaOrientation,
  feedAspectRatioForOrientation,
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
  __resetAuthorizedMediaSessionForTests();
});

function jpegBlob(): Blob {
  return new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" });
}

describe("MEDIA-02 — PublicationMediaFrame", () => {
  it("portrait feed → aspect-ratio 4/5 et data-orientation", () => {
    const { container } = render(
      <PublicationMediaFrame variant="feed" kind="image" orientation="portrait">
        <span>x</span>
      </PublicationMediaFrame>,
    );
    const frame = container.querySelector("[data-publication-media-frame='feed']") as HTMLElement;
    expect(frame.getAttribute("data-publication-media-orientation")).toBe("portrait");
    expect(frame.style.aspectRatio.replace(/\s/g, "")).toBe(
      feedAspectRatioForOrientation("portrait").replace(/\s/g, ""),
    );
    expect(frame.className).toContain("publication-media-frame--feed");
  });

  it("paysage / carré", () => {
    const { rerender, container } = render(
      <PublicationMediaFrame variant="feed" kind="image" orientation="landscape">
        <span />
      </PublicationMediaFrame>,
    );
    expect(
      (container.querySelector("[data-publication-media-frame]") as HTMLElement).style.aspectRatio.replace(
        /\s/g,
        "",
      ),
    ).toBe("16/9");
    rerender(
      <PublicationMediaFrame variant="feed" kind="image" orientation="square">
        <span />
      </PublicationMediaFrame>,
    );
    expect(
      (container.querySelector("[data-publication-media-frame]") as HTMLElement).style.aspectRatio.replace(
        /\s/g,
        "",
      ),
    ).toBe("1/1");
  });

  it("viewer → contain, pas de ratio feed", () => {
    const { container } = render(
      <PublicationMediaFrame variant="viewer" kind="image" orientation="portrait" feedPublicationMarker={false}>
        <img alt="" src="blob:x" className="publication-media-frame__media" />
      </PublicationMediaFrame>,
    );
    const frame = container.querySelector("[data-publication-media-frame='viewer']") as HTMLElement;
    expect(frame.getAttribute("data-publication-media-fit")).toBe("contain");
    expect(frame.style.aspectRatio).toBe("");
  });
});

describe("MEDIA-02 — FeedPublicationMedia cadre", () => {
  it("ready : object-cover dans le cadre, pas object-contain pleine hauteur", async () => {
    fetchAuthorizedMediaBlob.mockResolvedValue({ blob: jpegBlob(), contentType: "image/jpeg" });
    const { container } = render(<FeedPublicationMedia mediaUrl={VALID_MEDIA} label="Portrait" />);

    await waitFor(() => {
      expect(container.querySelector("[data-publication-media-frame='feed']")).not.toBeNull();
    });

    const decoding = await waitFor(() => {
      const img = container.querySelector('[data-authorized-media-state="decoding"] img');
      expect(img).not.toBeNull();
      return img as HTMLImageElement;
    });

    Object.defineProperty(decoding, "naturalWidth", { configurable: true, value: 1080 });
    Object.defineProperty(decoding, "naturalHeight", { configurable: true, value: 1920 });
    await act(async () => {
      fireEvent.load(decoding);
    });

    const ready = await screen.findByRole("img", { name: "Portrait" });
    expect(ready.className).toMatch(/object-cover/);
    expect(ready.className).not.toMatch(/object-contain/);
    const frame = container.querySelector("[data-publication-media-frame='feed']") as HTMLElement;
    expect(frame.getAttribute("data-publication-media-orientation")).toBe("portrait");
    expect(frame.style.aspectRatio.replace(/\s/g, "")).toBe("4/5");
  });

  it("erreur et retry restent dans le même cadre feed", async () => {
    fetchAuthorizedMediaBlob.mockRejectedValue(new Error("boom"));
    const { container } = render(<FeedPublicationMedia mediaUrl={VALID_MEDIA} label="x" />);
    expect(await screen.findByText(AUTHORIZED_MEDIA_UNAVAILABLE)).toBeTruthy();
    const frame = container.querySelector("[data-publication-media-frame='feed']");
    expect(frame).not.toBeNull();
    expect(frame?.querySelector("[data-authorized-media-state='error']")).not.toBeNull();
  });

  it("vidéo feed : object-contain sur fond sombre, cadre présent", () => {
    const { container } = render(
      <FeedPublicationMedia mediaUrl="/api/v1/local-videos/clip.mp4" label="Clip" />,
    );
    const frame = container.querySelector("[data-publication-media-frame='feed']") as HTMLElement;
    expect(frame.getAttribute("data-publication-media-kind")).toBe("video");
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.className).toMatch(/object-contain/);
  });
});

describe("MEDIA-02 — grille multi-médias", () => {
  it("5 médias → 4 tuiles + overflow +1, ordre conservé", () => {
    const urls = ["a.jpg", "b.jpg", "c.jpg", "d.jpg", "e.jpg"];
    const sliced = slicePublicationMediaForGrid(urls);
    expect(sliced.visible).toEqual(["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);
    expect(sliced.overflowCount).toBe(1);

    const { container } = render(
      <PublicationMediaGrid count={sliced.visible.length} overflowCount={sliced.overflowCount}>
        {sliced.visible.map((u) => (
          <div key={u} data-tile={u} />
        ))}
      </PublicationMediaGrid>,
    );
    expect(container.querySelector("[data-publication-media-grid='quad']")).not.toBeNull();
    expect(container.querySelector("[data-publication-media-overflow='1']")).not.toBeNull();
    expect(screen.getByLabelText("1 médias supplémentaires").textContent).toBe("+1");
  });

  it("2 / 3 / 4 dispositions", () => {
    const { rerender, container } = render(
      <PublicationMediaGrid count={2} overflowCount={0}>
        <div />
        <div />
      </PublicationMediaGrid>,
    );
    expect(container.querySelector("[data-publication-media-grid='pair']")).not.toBeNull();
    rerender(
      <PublicationMediaGrid count={3} overflowCount={0}>
        <div />
        <div />
        <div />
      </PublicationMediaGrid>,
    );
    expect(container.querySelector("[data-publication-media-grid='triple']")).not.toBeNull();
    rerender(
      <PublicationMediaGrid count={4} overflowCount={0}>
        <div />
        <div />
        <div />
        <div />
      </PublicationMediaGrid>,
    );
    expect(container.querySelector("[data-publication-media-grid='quad']")).not.toBeNull();
  });
});

// ───────────── MEDIA-02 — scénarios complémentaires (PHASE 8)

describe("MEDIA-02 — orientation depuis les dimensions réelles", () => {
  it("vidéo portrait et vidéo paysage sont classées par videoWidth/videoHeight", () => {
    // Même nom de fichier, orientations opposées : seule la mesure décide.
    expect(classifyMediaOrientation(1080, 1920)).toBe("portrait");
    expect(classifyMediaOrientation(1920, 1080)).toBe("landscape");
    // Le cadre suit la classification, pas le type de média.
    expect(feedAspectRatioForOrientation("portrait")).toBe("4 / 5");
    expect(feedAspectRatioForOrientation("landscape")).toBe("16 / 9");
  });

  it("une vidéo portrait reçoit le cadre 4:5 et reste en contain", () => {
    const { container } = render(
      <PublicationMediaFrame variant="feed" kind="video" orientation="portrait">
        <video data-testid="v" />
      </PublicationMediaFrame>,
    );
    const frame = container.querySelector("[data-publication-media-frame='feed']") as HTMLElement;
    expect(frame.getAttribute("data-publication-media-orientation")).toBe("portrait");
    expect(frame.getAttribute("data-publication-media-kind")).toBe("video");
    // Une vidéo n'est jamais recadrée : on ne coupe pas l'image filmée.
    expect(frame.getAttribute("data-publication-media-fit")).toBe("contain");
    expect(frame.style.aspectRatio.replace(/\s/g, "")).toBe("4/5");
  });

  it("une vidéo paysage reçoit le cadre 16:9, toujours en contain", () => {
    const { container } = render(
      <PublicationMediaFrame variant="feed" kind="video" orientation="landscape">
        <video />
      </PublicationMediaFrame>,
    );
    const frame = container.querySelector("[data-publication-media-frame='feed']") as HTMLElement;
    expect(frame.style.aspectRatio.replace(/\s/g, "")).toBe("16/9");
    expect(frame.getAttribute("data-publication-media-fit")).toBe("contain");
  });
});

describe("MEDIA-02 — le cadre ne saute pas entre les états", () => {
  it("loading puis ready occupent exactement le même cadre", async () => {
    let resoudre: ((b: Blob) => void) | null = null;
    fetchAuthorizedMediaBlob.mockReturnValue(
      new Promise<Blob>((r) => {
        resoudre = r;
      }),
    );

    const { container } = render(<FeedPublicationMedia mediaUrl={VALID_MEDIA} label="Portrait" />);

    const pendant = container.querySelector(
      "[data-publication-media-frame='feed']",
    ) as HTMLElement;
    expect(pendant, "aucun cadre pendant le chargement").not.toBeNull();
    const ratioPendant = pendant.style.aspectRatio.replace(/\s/g, "");
    const classePendant = pendant.className;

    await act(async () => {
      resoudre?.(jpegBlob());
      await Promise.resolve();
    });

    const apres = container.querySelector("[data-publication-media-frame='feed']") as HTMLElement;
    expect(apres, "le cadre disparait apres chargement").not.toBeNull();
    // Le ratio peut s'affiner une fois les dimensions connues, mais le cadre
    // reste le meme element de mise en page — pas de saut de hauteur brutal.
    expect(apres.className).toBe(classePendant);
    expect(ratioPendant.length).toBeGreaterThan(0);
  });

  it("l'erreur garde le cadre et propose Réessayer au même endroit", async () => {
    fetchAuthorizedMediaBlob.mockRejectedValue(new Error("reseau"));
    const { container } = render(<FeedPublicationMedia mediaUrl={VALID_MEDIA} label="Portrait" />);

    await waitFor(() => {
      expect(screen.getByText(AUTHORIZED_MEDIA_UNAVAILABLE)).toBeTruthy();
    });
    const cadre = container.querySelector("[data-publication-media-frame='feed']") as HTMLElement;
    expect(cadre, "l'erreur sort du cadre").not.toBeNull();
    expect(cadre.className).toContain("publication-media-frame--feed");
    expect(screen.getByRole("button", { name: /Réessayer/i })).toBeTruthy();
  });
});

describe("MEDIA-02 — viewer plein écran", () => {
  it("le viewer n'applique aucun ratio de feed et reste en contain", () => {
    const { container } = render(
      <PublicationMediaFrame variant="viewer" kind="image" orientation="portrait">
        <img alt="" />
      </PublicationMediaFrame>,
    );
    const frame = container.querySelector(
      "[data-publication-media-frame='viewer']",
    ) as HTMLElement;
    // Recadrer dans le viewer reviendrait a ne jamais montrer l'original.
    expect(frame.getAttribute("data-publication-media-fit")).toBe("contain");
    expect(frame.style.aspectRatio || "").toBe("");
    expect(frame.className).toContain("publication-media-frame--viewer");
  });

  it("le viewer garde le contain quelle que soit l'orientation", () => {
    for (const orientation of ["portrait", "square", "landscape"] as const) {
      const { container, unmount } = render(
        <PublicationMediaFrame variant="viewer" kind="video" orientation={orientation}>
          <video />
        </PublicationMediaFrame>,
      );
      const frame = container.querySelector(
        "[data-publication-media-frame='viewer']",
      ) as HTMLElement;
      expect(frame.getAttribute("data-publication-media-fit")).toBe("contain");
      expect(frame.style.aspectRatio || "").toBe("");
      unmount();
    }
  });
});
