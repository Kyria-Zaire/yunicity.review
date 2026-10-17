// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UploadCancelledError, type UploadProgress } from "@yunicity/utils";

/**
 * Progression et annulation de l'envoi vidéo — PR202-VIDEO-STREAMING-FINAL-GATE.
 *
 * L'écran affichait une barre animée d'un tiers de large, pulsée par CSS :
 * elle bougeait sans rien mesurer. Sur une vidéo de 200 Mo, l'utilisateur
 * n'avait aucun moyen de savoir si l'envoi avançait ou si sa connexion était
 * morte, ni de l'interrompre.
 *
 * Ce fichier vérifie trois choses que l'utilisateur constate directement : la
 * progression reflète les octets, l'annulation rend la main, et un second clic
 * ne lance pas un second envoi.
 */

const mocks = vi.hoisted(() => ({
  uploadSessionBytes: vi.fn(),
  createUpload: vi.fn(),
  publishVideo: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
}));

const api = {
  localVideos: {
    createUpload: mocks.createUpload,
    uploadSessionBytes: mocks.uploadSessionBytes,
    publishVideo: mocks.publishVideo,
  },
};

vi.mock("@/hooks/use-local-video-upload-context", () => ({
  useLocalVideoUploadContext: () => ({
    api,
    city: "Reims",
    neighborhoods: [{ id: "n1", display_name: "Boulingrin", slug: "boulingrin" }],
    loadingNeighborhoods: false,
  }),
}));
vi.mock("@/hooks/use-local-video-duration-policy", () => ({
  useLocalVideoDurationPolicy: () => ({ maxDurationSeconds: 90, tier: "citizen" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
}));
vi.mock("@/components/videos/videos-app-shell", () => ({
  VideosAppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/videos/new-local-video-form", () => ({
  NewLocalVideoForm: ({
    onSubmit,
  }: {
    onSubmit: (v: Record<string, unknown>) => Promise<void>;
  }) => (
    <button
      type="button"
      data-testid="publier"
      onClick={() =>
        void onSubmit({
          file: new File([new Uint8Array(4)], "clip.mp4", { type: "video/mp4" }),
          title: "Titre",
          description: "",
          neighborhoodId: "n1",
          contentType: "video/mp4",
        })
      }
    >
      Publier
    </button>
  ),
}));

import { NewLocalVideoScreen } from "@/components/videos/new-local-video-screen";

/** Contrôle l'envoi depuis le test : progression et fin à la demande. */
function envoiPilote() {
  let rapporter: ((p: UploadProgress) => void) | undefined;
  let terminer: (() => void) | undefined;
  let rejeter: ((e: unknown) => void) | undefined;
  let signalRecu: AbortSignal | undefined;

  mocks.uploadSessionBytes.mockImplementation(
    (_upload: unknown, _body: unknown, options: Record<string, never>) => {
      const opts = options as unknown as {
        onProgress?: (p: UploadProgress) => void;
        signal?: AbortSignal;
      };
      rapporter = opts.onProgress;
      signalRecu = opts.signal;
      return new Promise<void>((resolve, reject) => {
        terminer = resolve;
        rejeter = reject;
        // Un vrai envoi rejette quand le signal s'abaisse.
        opts.signal?.addEventListener("abort", () => reject(new UploadCancelledError()), {
          once: true,
        });
      });
    },
  );

  return {
    progresser: (loaded: number, total: number | null) =>
      act(() => {
        rapporter?.({
          loaded,
          total,
          ratio: total ? Math.min(1, loaded / total) : null,
        });
      }),
    terminer: () => act(() => void terminer?.()),
    rejeter: (e: unknown) => act(() => void rejeter?.(e)),
    signal: () => signalRecu,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createUpload.mockResolvedValue({
    upload_id: "u1",
    presigned_url: "https://exemple.test/binary",
    upload_method: "PUT",
    upload_headers: {},
  });
  mocks.publishVideo.mockResolvedValue({ id: "v1" });
});

afterEach(cleanup);

async function lancerEnvoi() {
  render(<NewLocalVideoScreen />);
  fireEvent.click(screen.getByTestId("publier"));
  await waitFor(() => expect(mocks.uploadSessionBytes).toHaveBeenCalledTimes(1));
}

describe("progression réelle", () => {
  it("la barre suit les octets transmis", async () => {
    const pilote = envoiPilote();
    await lancerEnvoi();

    pilote.progresser(25 * 1024 * 1024, 100 * 1024 * 1024);

    const barre = await screen.findByRole("progressbar");
    expect(barre.getAttribute("aria-valuenow")).toBe("25");
    expect(screen.getByText("25 %")).toBeTruthy();

    pilote.progresser(80 * 1024 * 1024, 100 * 1024 * 1024);
    await waitFor(() => expect(barre.getAttribute("aria-valuenow")).toBe("80"));
  });

  it("sans total connu, aucun pourcentage n'est affiché", async () => {
    const pilote = envoiPilote();
    await lancerEnvoi();

    pilote.progresser(7 * 1024 * 1024, null);

    const barre = await screen.findByRole("progressbar");
    // Pas de `aria-valuenow` : la barre est indéterminée, et le dire vaut
    // mieux qu'annoncer un pourcentage inventé.
    expect(barre.hasAttribute("aria-valuenow")).toBe(false);
    expect(screen.getByText(/7 Mo envoyés/)).toBeTruthy();
  });
});

describe("annulation", () => {
  it("le bouton Annuler abaisse le signal transmis à l'envoi", async () => {
    const pilote = envoiPilote();
    await lancerEnvoi();

    expect(pilote.signal()?.aborted).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /annuler l'envoi/i }));

    expect(pilote.signal()?.aborted).toBe(true);
  });

  it("l'interface redevient utilisable, sans message d'erreur", async () => {
    const pilote = envoiPilote();
    await lancerEnvoi();

    fireEvent.click(screen.getByRole("button", { name: /annuler l'envoi/i }));

    // Le formulaire revient…
    await waitFor(() => expect(screen.getByTestId("publier")).toBeTruthy());
    // …et l'annulation n'est PAS présentée comme une panne.
    expect(screen.queryByText(/impossible|échec|erreur/i)).toBeNull();
    expect(mocks.publishVideo).not.toHaveBeenCalled();
    expect(pilote.signal()?.aborted).toBe(true);
  });

  it("un nouvel envoi est possible après annulation", async () => {
    envoiPilote();
    await lancerEnvoi();
    fireEvent.click(screen.getByRole("button", { name: /annuler l'envoi/i }));
    await waitFor(() => expect(screen.getByTestId("publier")).toBeTruthy());

    fireEvent.click(screen.getByTestId("publier"));
    await waitFor(() => expect(mocks.uploadSessionBytes).toHaveBeenCalledTimes(2));
  });
});

describe("double soumission", () => {
  it("un second clic pendant l'envoi ne lance pas un second envoi", async () => {
    envoiPilote();
    render(<NewLocalVideoScreen />);
    const bouton = screen.getByTestId("publier");

    fireEvent.click(bouton);
    fireEvent.click(bouton);
    fireEvent.click(bouton);

    await waitFor(() => expect(mocks.uploadSessionBytes).toHaveBeenCalledTimes(1));
    expect(mocks.createUpload).toHaveBeenCalledTimes(1);
  });
});
