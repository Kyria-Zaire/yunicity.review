// @vitest-environment jsdom

/**
 * MEDIA-01 — GATE 4 : verrou de publication des QUATRE composers.
 *
 * Preuve comportementale : les composants sont réellement rendus et cliqués.
 * Une recherche textuelle du nom de la variable ne dirait rien de ce qui se
 * passe quand deux clics arrivent dans le même tick, ni de la libération du
 * verrou après un échec.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedDesktopComposer } from "@/components/feed/desktop/feed-desktop-composer";
import { FeedMobileComposer } from "@/components/feed/mobile/feed-mobile-composer";
import { TerritoryMobilePostComposer } from "@/components/shared/mobile/territory-mobile-post-composer";

const uploadPostMedia = vi.fn();
const getProfileMe = vi.fn();
const routerPush = vi.fn();

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({ uploadPostMedia, getProfileMe }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: { email: "citoyen@exemple.test" } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => "/",
}));

vi.mock("@/components/avatar-image", () => ({
  AvatarImage: () => null,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function image(name = "photo.jpg", type = "image/jpeg", size = 3): File {
  return new File([new Uint8Array(size)], name, { type });
}

const createObjectURL = vi.fn(() => "blob:apercu");
const revokeObjectURL = vi.fn();

beforeEach(() => {
  uploadPostMedia.mockReset();
  getProfileMe.mockReset();
  getProfileMe.mockResolvedValue({ full_name: "Citoyen", avatar_url: null });
  routerPush.mockReset();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/**
 * Les quatre composers, chacun avec ce qu'il faut pour atteindre son bouton
 * publier : certains démarrent repliés.
 */
const COMPOSERS = [
  {
    nom: "feed générique",
    rendu: (onSubmit: (b: string, m?: string | null) => Promise<void>) =>
      render(<FeedComposer onSubmit={onSubmit} city="Reims" />),
    deplier: async () => {},
    champ: () => screen.getByPlaceholderText(/Quoi de neuf à Reims/i),
    publier: () => screen.getByRole("button", { name: /^Publier$/i }),
  },
  {
    nom: "mobile",
    rendu: (onSubmit: (b: string, m?: string | null) => Promise<void>) =>
      render(<FeedMobileComposer city="Reims" onSubmit={onSubmit} />),
    deplier: async () => {
      fireEvent.click(screen.getByRole("button", { name: /Quoi de neuf à Reims/i }));
    },
    champ: () => screen.getByPlaceholderText(/Quoi de neuf à Reims/i),
    publier: () => screen.getByRole("button", { name: /Publier/i }),
  },
  {
    nom: "desktop",
    rendu: (onSubmit: (b: string, m?: string | null) => Promise<void>) =>
      render(
        <FeedDesktopComposer
          city="Reims"
          avatarInitial="C"
          avatarUrl={null}
          onSubmit={onSubmit}
        />,
      ),
    deplier: async () => {},
    champ: () => screen.getByPlaceholderText(/Quoi de neuf/i),
    publier: () => screen.getByRole("button", { name: /Publier/i }),
  },
  {
    nom: "territorial mobile",
    rendu: (onSubmit: (b: string, m?: string | null) => Promise<void>) =>
      render(<TerritoryMobilePostComposer onSubmit={onSubmit} />),
    deplier: async () => {
      fireEvent.click(screen.getByRole("button", { name: /Partage un bon plan/i }));
    },
    champ: () => screen.getByPlaceholderText(/Partage un bon plan/i),
    publier: () => screen.getByRole("button", { name: /Publier/i }),
  },
] as const;

/**
 * Clique sur « publier » si le composer l'expose et l'autorise. Certains
 * composers retirent ou désactivent le bouton quand la publication est
 * impossible : son absence est alors une preuve aussi valable qu'un clic sans
 * effet.
 */
function cliquerPublierSiPossible(composer: (typeof COMPOSERS)[number]): void {
  let bouton: HTMLElement | null = null;
  try {
    bouton = composer.publier();
  } catch {
    return;
  }
  if ((bouton as HTMLButtonElement).disabled) return;
  fireEvent.click(bouton);
}

/** Saisit un texte et rend la main une fois le composer prêt à publier. */
async function prepare(
  composer: (typeof COMPOSERS)[number],
  onSubmit: (b: string, m?: string | null) => Promise<void>,
): Promise<void> {
  composer.rendu(onSubmit);
  await composer.deplier();
  fireEvent.change(composer.champ(), { target: { value: "Bonjour Reims" } });
  await waitFor(() => expect(composer.publier()).toBeTruthy());
}

describe.each(COMPOSERS)("GATE 4 — verrou de publication ($nom)", (composer) => {
  it("deux clics synchrones ⇒ exactement une création", async () => {
    const attente = deferred<void>();
    const onSubmit = vi.fn(() => attente.promise);
    await prepare(composer, onSubmit);

    const bouton = composer.publier();
    // Même tick : l'état `isSubmitting` n'a pas encore été appliqué, donc seul
    // un verrou synchrone peut empêcher la deuxième création.
    act(() => {
      fireEvent.click(bouton);
      fireEvent.click(bouton);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => {
      attente.resolve();
      await attente.promise;
    });
  });

  it("trois clics synchrones ⇒ toujours une seule création", async () => {
    const attente = deferred<void>();
    const onSubmit = vi.fn(() => attente.promise);
    await prepare(composer, onSubmit);
    const bouton = composer.publier();
    act(() => {
      fireEvent.click(bouton);
      fireEvent.click(bouton);
      fireEvent.click(bouton);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => {
      attente.resolve();
      await attente.promise;
    });
  });

  it("clic pendant l'envoi du média ⇒ zéro création", async () => {
    const enVol = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(enVol.promise);
    const onSubmit = vi.fn(async () => {});
    await prepare(composer, onSubmit);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    await act(async () => {
      fireEvent.change(input, { target: { files: [image()] } });
    });

    act(() => {
      cliquerPublierSiPossible(composer);
    });
    expect(onSubmit).not.toHaveBeenCalled();

    await act(async () => {
      enVol.resolve({ url: "/media/a.jpg" });
      await enVol.promise;
    });
  });

  it("média refusé puis clic Publier ⇒ ZÉRO création", async () => {
    const onSubmit = vi.fn<(b: string, m?: string | null) => Promise<void>>(async () => {});
    await prepare(composer, onSubmit);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [image("doc.pdf", "application/pdf")] } });
    });
    expect(uploadPostMedia).not.toHaveBeenCalled();

    await act(async () => {
      cliquerPublierSiPossible(composer);
    });

    // Publier ici retirerait la photo dans le dos de l'utilisateur.
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("média refusé puis « Continuer sans image » ⇒ une publication texte", async () => {
    const onSubmit = vi.fn<(b: string, m?: string | null) => Promise<void>>(async () => {});
    await prepare(composer, onSubmit);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [image("doc.pdf", "application/pdf")] } });
    });

    const abandon = await screen.findByRole("button", { name: /Continuer sans image/i });
    await act(async () => {
      fireEvent.click(abandon);
    });
    // L'arbitrage seul ne publie rien.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(uploadPostMedia).not.toHaveBeenCalled();

    await act(async () => {
      cliquerPublierSiPossible(composer);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[1] ?? null).toBeNull();
  });

  it("média refusé puis image valide ⇒ envoi puis publication AVEC média", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/media/ok.jpg" });
    const onSubmit = vi.fn<(b: string, m?: string | null) => Promise<void>>(async () => {});
    await prepare(composer, onSubmit);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [image("doc.pdf", "application/pdf")] } });
    });
    await act(async () => {
      fireEvent.change(input, { target: { files: [image("ok.jpg")] } });
    });

    await waitFor(() => expect(uploadPostMedia).toHaveBeenCalledTimes(1));
    await act(async () => {
      cliquerPublierSiPossible(composer);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[1]).toBe("/media/ok.jpg");
  });

  it("HEIC puis abandon explicite : le texte saisi est conservé", async () => {
    const onSubmit = vi.fn<(b: string, m?: string | null) => Promise<void>>(async () => {});
    await prepare(composer, onSubmit);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [image("IMG.HEIC", "image/heic")] } });
    });
    expect((await screen.findByRole("alert")).textContent).toMatch(/HEIC/i);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continuer sans image/i }));
    });

    expect((composer.champ() as HTMLTextAreaElement).value).toBe("Bonjour Reims");
    await act(async () => {
      cliquerPublierSiPossible(composer);
    });
    expect(onSubmit).toHaveBeenCalledWith("Bonjour Reims", null);
  });

  it("erreur de taille puis même fichier corrigé ⇒ envoi accepté", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/media/ok.jpg" });
    const onSubmit = vi.fn<(b: string, m?: string | null) => Promise<void>>(async () => {});
    await prepare(composer, onSubmit);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, {
        target: { files: [image("photo.jpg", "image/jpeg", 21 * 1024 * 1024)] },
      });
    });
    expect((await screen.findByRole("alert")).textContent).toMatch(/20 Mo/i);

    // Même nom, taille corrigée : l'input a été réinitialisé, la sélection repart.
    await act(async () => {
      fireEvent.change(input, { target: { files: [image("photo.jpg", "image/jpeg", 1024)] } });
    });
    await waitFor(() => expect(uploadPostMedia).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("aucune ancienne erreur n'est annoncée après résolution", async () => {
    const onSubmit = vi.fn<(b: string, m?: string | null) => Promise<void>>(async () => {});
    await prepare(composer, onSubmit);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [image("doc.pdf", "application/pdf")] } });
    });
    await screen.findByRole("alert");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continuer sans image/i }));
    });

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: /Continuer sans image/i })).toBeNull();
  });

  it("un média encore en vol bloque la publication, lui", async () => {
    const enVol = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(enVol.promise);
    const onSubmit = vi.fn(async () => {});
    await prepare(composer, onSubmit);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [image()] } });
    });
    act(() => {
      cliquerPublierSiPossible(composer);
    });
    // Le cas dangereux : créer un post qui pointe vers un média pas encore
    // stocké.
    expect(onSubmit).not.toHaveBeenCalled();
    await act(async () => {
      enVol.resolve({ url: "/media/a.jpg" });
      await enVol.promise;
    });
  });

  it("premier appel échoué ⇒ verrou libéré, et un seul nouvel appel au retry", async () => {
    const onSubmit = vi
      .fn<(b: string, m?: string | null) => Promise<void>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);
    await prepare(composer, onSubmit);

    await act(async () => {
      fireEvent.click(composer.publier());
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Le texte est conservé : le verrou libéré doit permettre exactement une
    // nouvelle tentative, pas deux.
    await waitFor(() => expect(composer.publier()).toBeTruthy());
    act(() => {
      fireEvent.click(composer.publier());
      fireEvent.click(composer.publier());
    });
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("succès ⇒ formulaire nettoyé une seule fois", async () => {
    const onSubmit = vi.fn(async () => {});
    await prepare(composer, onSubmit);

    await act(async () => {
      fireEvent.click(composer.publier());
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      // Le texte est effacé — ou le composer s'est replié, ce qui le retire du
      // DOM : dans les deux cas le brouillon n'a pas survécu.
      let champ: HTMLElement | null = null;
      try {
        champ = composer.champ();
      } catch {
        champ = null;
      }
      expect(champ === null || (champ as HTMLTextAreaElement).value === "").toBe(true);
    });
    // Aucun second envoi déclenché par le nettoyage lui-même.
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("un échec affiche un message sans exposer la réponse brute", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("secret-technique-r2://bucket/cle");
    });
    await prepare(composer, onSubmit);

    await act(async () => {
      fireEvent.click(composer.publier());
    });

    const alerte = await screen.findByRole("alert");
    // Capture non vide : l'assertion d'absence porte sur un texte réel.
    expect(alerte.textContent?.length ?? 0).toBeGreaterThan(0);
    expect(alerte.textContent).not.toContain("secret-technique-r2");
    expect(alerte.textContent).not.toContain("bucket");
  });
});
