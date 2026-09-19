// @vitest-environment jsdom

/**
 * MEDIA-01 — cinquième parcours de publication : `/feed/new`.
 *
 * Route active (`app/feed/new/page.tsx`, exposée par le hub de création), donc
 * dans le périmètre MEDIA-01. Son architecture diffère des quatre autres
 * composers — multi-médias, envoi au moment de publier — mais les garanties
 * exigées sont les mêmes : abandon, budget de temps, verrou synchrone, cycle de
 * vie des object URL, contrat MIME et mapping d'erreurs.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AuthError,
  COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
  COMPOSER_MEDIA_RATE_LIMITED,
  COMPOSER_MEDIA_SERVER_FAILED,
  composerMediaUploadTimeoutMs,
} from "@yunicity/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NewPostScreen } from "@/components/feed/post-composer/new-post-screen";
import { useNewPostDraft } from "@/hooks/use-new-post-draft";
import { renderHook } from "@testing-library/react";

const uploadPostMedia = vi.fn();
const createFeedPost = vi.fn();
const getProfileMe = vi.fn();

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({ uploadPostMedia, createFeedPost, getProfileMe }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: { email: "citoyen@exemple.test" } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => "/feed/new",
}));

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock("@/components/brand", () => ({ YunicityLogo: () => null }));
vi.mock("@/components/layout/citizen-top-nav", () => ({ CitizenTopNav: () => null }));
vi.mock("@/components/layout/web-sidebar", () => ({ WebSidebar: () => null }));

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

const createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}-${Math.random()}`);
const revokeObjectURL = vi.fn();

beforeEach(() => {
  uploadPostMedia.mockReset();
  createFeedPost.mockReset();
  createFeedPost.mockResolvedValue({ id: "p1" });
  getProfileMe.mockReset();
  getProfileMe.mockResolvedValue({ display_name: "Citoyen", username: "citoyen", city: "Reims" });
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * Saisit le texte et joint un fichier, puis rend la main.
 *
 * L'écran monte SES DEUX vues — mobile et desktop — et les départage par CSS.
 * En jsdom les deux existent : on renseigne donc les deux zones de saisie.
 */
async function preparer(fichiers: File[] = [image()]): Promise<void> {
  render(<NewPostScreen />);
  const zones = await screen.findAllByPlaceholderText(/Quoi de neuf à/i);
  for (const zone of zones) {
    fireEvent.change(zone, { target: { value: "Bonjour Reims" } });
  }
  const entree = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(entree, { target: { files: fichiers } });
  });
}

/** Premier bouton « Publier » réellement actionnable. */
function boutonPublier(): HTMLElement {
  const boutons = screen.getAllByRole("button", { name: /^Publier$/i });
  const actif = boutons.find((b) => !(b as HTMLButtonElement).disabled);
  expect(actif, "aucun bouton Publier actionnable").toBeDefined();
  return actif!;
}

describe("cycle de vie des object URL (multi-médias)", () => {
  it("ajouter un second média ne révoque pas l'aperçu du premier", async () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));

    await act(async () => {
      await result.current.handleSelectedFiles([image("a.jpg")] as unknown as FileList);
    });
    const premier = result.current.selectedMedia[0]!.previewUrl;

    await act(async () => {
      await result.current.handleSelectedFiles([image("b.jpg")] as unknown as FileList);
    });

    expect(result.current.selectedMedia).toHaveLength(2);
    // L'aperçu du premier est toujours affiché : le révoquer casse l'image.
    expect(revokeObjectURL).not.toHaveBeenCalledWith(premier);
  });

  it("retirer un média révoque exactement son aperçu, une seule fois", async () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    await act(async () => {
      await result.current.handleSelectedFiles([image("a.jpg"), image("b.jpg")] as unknown as FileList);
    });
    const [a, b] = result.current.selectedMedia;
    revokeObjectURL.mockClear();

    act(() => {
      result.current.removeMedia(a!.id);
    });

    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(a!.previewUrl);
    expect(revokeObjectURL).not.toHaveBeenCalledWith(b!.previewUrl);
  });

  it("le démontage libère les aperçus restants", async () => {
    const { result, unmount } = renderHook(() => useNewPostDraft("Reims"));
    await act(async () => {
      await result.current.handleSelectedFiles([image("a.jpg")] as unknown as FileList);
    });
    const url = result.current.selectedMedia[0]!.previewUrl;
    revokeObjectURL.mockClear();

    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith(url);
  });
});

describe("contrat de métadonnées, aligné sur les quatre autres composers", () => {
  it("refuse HEIC avec le message explicite", async () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    await act(async () => {
      await result.current.handleSelectedFiles([
        image("IMG_0001.HEIC", "image/heic"),
      ] as unknown as FileList);
    });
    expect(result.current.selectedMedia).toHaveLength(0);
    expect(result.current.uploadError).toBe(COMPOSER_MEDIA_HEIC_NOT_SUPPORTED);
  });

  it("refuse .HEIC à MIME vide avec le même message", async () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    await act(async () => {
      await result.current.handleSelectedFiles([image("IMG.HEIC", "")] as unknown as FileList);
    });
    expect(result.current.selectedMedia).toHaveLength(0);
    expect(result.current.uploadError).toBe(COMPOSER_MEDIA_HEIC_NOT_SUPPORTED);
  });

  it("accepte un JPEG à MIME vide, le backend restant l'autorité", async () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    await act(async () => {
      await result.current.handleSelectedFiles([image("photo.jpg", "")] as unknown as FileList);
    });
    expect(result.current.selectedMedia).toHaveLength(1);
    expect(result.current.uploadError).toBeNull();
  });

  it("accepte toujours les vidéos du parcours", async () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => {
      result.current.setFormat("video");
    });
    await act(async () => {
      await result.current.handleSelectedFiles([
        new File([new Uint8Array(3)], "clip.mp4", { type: "video/mp4" }),
      ] as unknown as FileList);
    });
    expect(result.current.selectedMedia).toHaveLength(1);
    expect(result.current.selectedMedia[0]!.mediaType).toBe("video");
  });
});

describe("envoi : abandon et budget de temps", () => {
  it("transmet un AbortSignal à chaque envoi", async () => {
    const attente = deferred<{ url: string; media_type: string }>();
    uploadPostMedia.mockReturnValue(attente.promise);
    await preparer();

    await act(async () => {
      fireEvent.click(boutonPublier());
    });

    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
    const [, signal] = uploadPostMedia.mock.calls[0]!;
    expect(signal, "aucun AbortSignal transmis").toBeInstanceOf(AbortSignal);

    await act(async () => {
      attente.resolve({ url: "/m/a.jpg", media_type: "image" });
      await attente.promise;
    });
  });

  it("abandonne l'envoi au démontage", async () => {
    const attente = deferred<{ url: string; media_type: string }>();
    uploadPostMedia.mockReturnValue(attente.promise);
    await preparer();
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const [, signal] = uploadPostMedia.mock.calls[0]! as [File, AbortSignal];
    expect(signal.aborted).toBe(false);

    cleanup();
    expect(signal.aborted, "l'envoi survit au démontage").toBe(true);
  });

  it("arme un budget de temps proportionnel, et abandonne à l'échéance", async () => {
    const gros = image("grande.jpg", "image/jpeg", 10 * 1024 * 1024);
    const attente = deferred<{ url: string; media_type: string }>();
    uploadPostMedia.mockReturnValue(attente.promise);
    await preparer([gros]);
    // Les faux minuteurs viennent APRÈS la préparation : installés avant, les
    // attentes de Testing Library ne progresseraient jamais.
    vi.useFakeTimers();

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const [, signal] = uploadPostMedia.mock.calls[0]! as [File, AbortSignal];

    await act(async () => {
      vi.advanceTimersByTime(composerMediaUploadTimeoutMs(gros.size) - 1);
    });
    expect(signal.aborted).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(2);
    });
    expect(signal.aborted, "aucun budget de temps armé").toBe(true);
  });
});

describe("verrou de publication", () => {
  it("deux clics synchrones ⇒ exactement une création", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/a.jpg", media_type: "image" });
    const attente = deferred<{ id: string }>();
    createFeedPost.mockReturnValue(attente.promise);
    await preparer();

    const bouton = boutonPublier();
    act(() => {
      fireEvent.click(bouton);
      fireEvent.click(bouton);
    });
    await waitFor(() => expect(uploadPostMedia).toHaveBeenCalled());

    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
    await act(async () => {
      attente.resolve({ id: "p1" });
      await attente.promise;
    });
    expect(createFeedPost).toHaveBeenCalledTimes(1);
  });

  it("un échec libère le verrou, et un seul nouvel essai passe", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/a.jpg", media_type: "image" });
    createFeedPost.mockRejectedValueOnce(new AuthError("UNKNOWN_ERROR", "brut", 500));
    createFeedPost.mockResolvedValueOnce({ id: "p1" });
    await preparer();

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(boutonPublier());
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));
    expect(createFeedPost).toHaveBeenCalledTimes(2);
  });
});

describe("mapping d'erreurs, aligné sur les quatre autres composers", () => {
  it("429 annonce la limite plutôt qu'un « réessayez » trompeur", async () => {
    uploadPostMedia.mockRejectedValue(new AuthError("RATE_LIMITED", "brut", 429));
    await preparer();
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const [alerte] = await screen.findAllByRole("alert");
    expect(alerte!.textContent).toBe(COMPOSER_MEDIA_RATE_LIMITED);
  });

  it("5xx annonce une indisponibilité de service", async () => {
    uploadPostMedia.mockRejectedValue(new AuthError("UNKNOWN_ERROR", "brut", 503));
    await preparer();
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const [alerte] = await screen.findAllByRole("alert");
    expect(alerte!.textContent).toBe(COMPOSER_MEDIA_SERVER_FAILED);
  });

  it("n'expose jamais la réponse brute", async () => {
    const secret = "r2://bucket/cle-privee?X-Amz-Signature=abc";
    uploadPostMedia.mockRejectedValue(new AuthError("UNKNOWN_ERROR", secret, 500));
    await preparer();
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const [alerte] = await screen.findAllByRole("alert");
    expect(alerte!.textContent?.length ?? 0).toBeGreaterThan(0);
    expect(alerte!.textContent).not.toContain("bucket");
    expect(alerte!.textContent).not.toContain("X-Amz-Signature");
  });
});

describe("média refusé : décision explicite exigée ici aussi", () => {
  it("le refus est ANNONCÉ, pas silencieux", async () => {
    render(<NewPostScreen />);
    const zones = await screen.findAllByPlaceholderText(/Quoi de neuf à/i);
    for (const zone of zones) fireEvent.change(zone, { target: { value: "Bonjour Reims" } });
    const entree = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(entree, { target: { files: [image("IMG.HEIC", "image/heic")] } });
    });

    const [alerte] = await screen.findAllByRole("alert");
    expect(alerte!.textContent).toBe(COMPOSER_MEDIA_HEIC_NOT_SUPPORTED);
  });

  it("bloque la publication tant que le refus n'est pas arbitré", async () => {
    const onSubmitSpy = uploadPostMedia;
    render(<NewPostScreen />);
    const zones = await screen.findAllByPlaceholderText(/Quoi de neuf à/i);
    for (const zone of zones) fireEvent.change(zone, { target: { value: "Bonjour Reims" } });
    const entree = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(entree, { target: { files: [image("IMG.HEIC", "image/heic")] } });
    });

    const boutons = screen.getAllByRole("button", { name: /^Publier$/i });
    await act(async () => {
      for (const b of boutons) if (!(b as HTMLButtonElement).disabled) fireEvent.click(b);
    });

    expect(createFeedPost).not.toHaveBeenCalled();
    expect(onSubmitSpy).not.toHaveBeenCalled();
  });

  it("« Continuer sans média » débloque et conserve le texte", async () => {
    render(<NewPostScreen />);
    const zones = await screen.findAllByPlaceholderText(/Quoi de neuf à/i);
    for (const zone of zones) fireEvent.change(zone, { target: { value: "Bonjour Reims" } });
    const entree = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(entree, { target: { files: [image("IMG.HEIC", "image/heic")] } });
    });

    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Continuer sans média/i }));
    });
    expect(createFeedPost).not.toHaveBeenCalled();

    const zonesApres = screen.getAllByPlaceholderText(/Quoi de neuf à/i);
    expect((zonesApres[0] as HTMLTextAreaElement).value).toBe("Bonjour Reims");

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).not.toHaveBeenCalled();
  });

  it("choisir une image valide lève le blocage et efface l'annonce", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    render(<NewPostScreen />);
    const zones = await screen.findAllByPlaceholderText(/Quoi de neuf à/i);
    for (const zone of zones) fireEvent.change(zone, { target: { value: "Bonjour Reims" } });
    const entree = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(entree, { target: { files: [image("IMG.HEIC", "image/heic")] } });
    });
    await screen.findAllByRole("alert");

    await act(async () => {
      fireEvent.change(entree, { target: { files: [image("ok.jpg")] } });
    });
    expect(screen.queryAllByRole("alert")).toHaveLength(0);

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
  });
});

// ───────────── MEDIA-01-SEMANTIC-CORRECTION-01 — libellés véridiques

/** Joint une sélection de fichiers en une seule fois. */
async function selectionner(fichiers: File[]): Promise<void> {
  const entree = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(entree, { target: { files: fichiers } });
  });
}

async function monterAvecTexte(): Promise<void> {
  render(<NewPostScreen />);
  const zones = await screen.findAllByPlaceholderText(/Quoi de neuf à/i);
  for (const zone of zones) fireEvent.change(zone, { target: { value: "Bonjour Reims" } });
}

function video(name = "clip.mp4", type = "video/mp4", size = 3): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("arbitrage d'une sélection multiple — libellé conforme au comportement", () => {
  it("image valide + HEIC : la valide est conservée, le libellé parle d'ignorer les refusés", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([image("ok.jpg"), image("IMG.HEIC", "image/heic")]);

    expect(await screen.findByRole("button", { name: /Ignorer les médias refusés/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Continuer sans image/i })).toBeNull();

    // Rien ne part avant arbitrage.
    await act(async () => {
      for (const b of screen.getAllByRole("button", { name: /^Publier$/i })) {
        if (!(b as HTMLButtonElement).disabled) fireEvent.click(b);
      }
    });
    expect(createFeedPost).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ignorer les médias refusés/i }));
    });
    // L'arbitrage seul ne publie rien.
    expect(createFeedPost).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
  });

  it("deux valides + une trop lourde : exactement deux médias publiés, aide véridique", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/x.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([
      image("a.jpg"),
      image("b.jpg"),
      image("enorme.jpg", "image/jpeg", 21 * 1024 * 1024),
    ]);

    expect(
      await screen.findByText(/Les autres médias valides et votre texte seront conservés/i),
    ).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ignorer les médias refusés/i }));
    });
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(2);
  });

  it("vidéo valide + image invalide : la vidéo est conservée, le libellé dit « médias »", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/clip.mp4", media_type: "video" });
    await monterAvecTexte();
    // Le format décide de ce qui est accepté — contrat historique, inchangé.
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /^Vidéo$/i })[0]!);
    });
    await selectionner([video(), image("doc.pdf", "application/pdf")]);

    const bouton = await screen.findByRole("button", { name: /Ignorer les médias refusés/i });
    expect(bouton.textContent).not.toMatch(/\bimage\b/i);
    expect(screen.queryByRole("button", { name: /Continuer sans image/i })).toBeNull();

    // La vidéo est bien restée : l'arbitrage puis la publication l'envoient.
    await act(async () => {
      fireEvent.click(bouton);
    });
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
    expect((uploadPostMedia.mock.calls[0]![0] as File).name).toBe("clip.mp4");
  });

  it("plusieurs fichiers refusés : le pluriel reste vrai et aucun n'est attaché", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([
      image("ok.jpg"),
      image("IMG.HEIC", "image/heic"),
      image("doc.pdf", "application/pdf"),
    ]);

    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Ignorer les médias refusés/i }));
    });
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
  });

  it("aucun média valide restant : « Continuer sans média », texte conservé", async () => {
    await monterAvecTexte();
    await selectionner([image("IMG.HEIC", "image/heic")]);

    expect(await screen.findByRole("button", { name: /Continuer sans média/i })).toBeTruthy();
    expect(await screen.findByText(/Votre texte sera conservé/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Ignorer les médias refusés/i })).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continuer sans média/i }));
    });
    expect(createFeedPost).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).not.toHaveBeenCalled();
  });
});

describe("échec d'envoi distinct d'un fichier refusé", () => {
  it("le deuxième envoi échoue : sélection entière conservée, aucun post, retry possible", async () => {
    uploadPostMedia
      .mockResolvedValueOnce({ url: "/m/a.jpg", media_type: "image" })
      .mockRejectedValueOnce(new AuthError("UNKNOWN_ERROR", "brut", 503))
      .mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([image("a.jpg"), image("b.jpg")]);

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const [alerte] = await screen.findAllByRole("alert");
    expect(alerte!.textContent).toBe(COMPOSER_MEDIA_SERVER_FAILED);
    // Ce n'est PAS une validation : aucun arbitrage ne doit apparaître.
    expect(screen.queryByRole("button", { name: /Ignorer les médias refusés/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Continuer sans média/i })).toBeNull();
    expect(createFeedPost).not.toHaveBeenCalled();

    uploadPostMedia.mockClear();
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    // La sélection entière est intacte : les deux repartent, dans l'ordre.
    expect(uploadPostMedia).toHaveBeenCalledTimes(2);
    expect((uploadPostMedia.mock.calls[0]![0] as File).name).toBe("a.jpg");
    expect((uploadPostMedia.mock.calls[1]![0] as File).name).toBe("b.jpg");
  });

  it("après un retry réussi, aucune erreur obsolète ne subsiste", async () => {
    uploadPostMedia
      .mockRejectedValueOnce(new AuthError("UNKNOWN_ERROR", "brut", 500))
      .mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([image("a.jpg")]);

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await screen.findAllByRole("alert");

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });
});

describe("contrôleur de lot — une tentative, un contrôleur", () => {
  it("le deuxième fichier expire : aucun troisième envoi", async () => {
    const bloque = deferred<{ url: string; media_type: string }>();
    uploadPostMedia
      .mockResolvedValueOnce({ url: "/m/a.jpg", media_type: "image" })
      .mockReturnValueOnce(bloque.promise);
    await monterAvecTexte();
    const deuxieme = image("b.jpg", "image/jpeg", 1024);
    await selectionner([image("a.jpg"), deuxieme, image("c.jpg")]);

    // Les minuteurs factices doivent etre en place AVANT que l'echeance ne soit
    // armee, sinon on avance une horloge qui ne pilote rien.
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    // Laisse le premier envoi se resoudre et le deuxieme partir (microtaches).
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(uploadPostMedia).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(composerMediaUploadTimeoutMs(deuxieme.size) + 1000);
    });
    const [, signal] = uploadPostMedia.mock.calls[1]! as [File, AbortSignal];
    expect(signal.aborted).toBe(true);
    bloque.reject(new DOMException("aborted", "AbortError"));
    await act(async () => {
      await Promise.resolve();
    });
    // Le lot s'arrête : le troisième ne part jamais.
    expect(uploadPostMedia).toHaveBeenCalledTimes(2);
    expect(createFeedPost).not.toHaveBeenCalled();
  });

  it("tous les envois d'une tentative partagent le MÊME signal", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/x.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([image("a.jpg"), image("b.jpg"), image("c.jpg")]);

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));

    const signaux = uploadPostMedia.mock.calls.map((appel) => appel[1]);
    expect(signaux).toHaveLength(3);
    expect(new Set(signaux).size, "un contrôleur par fichier au lieu d'un par tentative").toBe(1);
  });

  it("le retry crée un NOUVEAU contrôleur, non aborté", async () => {
    uploadPostMedia
      .mockRejectedValueOnce(new AuthError("UNKNOWN_ERROR", "brut", 500))
      .mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([image("a.jpg")]);

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const [, premier] = uploadPostMedia.mock.calls[0]! as [File, AbortSignal];

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    const [, second] = uploadPostMedia.mock.calls[1]! as [File, AbortSignal];

    expect(second).not.toBe(premier);
    expect(second.aborted).toBe(false);
  });

  it("l'abandon de l'ancienne tentative n'affecte pas le retry", async () => {
    const bloque = deferred<{ url: string; media_type: string }>();
    uploadPostMedia.mockReturnValueOnce(bloque.promise).mockResolvedValue({
      url: "/m/ok.jpg",
      media_type: "image",
    });
    await monterAvecTexte();
    await selectionner([image("a.jpg")]);

    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const [, ancien] = uploadPostMedia.mock.calls[0]! as [File, AbortSignal];

    await act(async () => {
      vi.advanceTimersByTime(composerMediaUploadTimeoutMs(3) + 1000);
    });
    bloque.reject(new DOMException("aborted", "AbortError"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(ancien.aborted).toBe(true);
    vi.useRealTimers();

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    const [, nouveau] = uploadPostMedia.mock.calls[1]! as [File, AbortSignal];
    expect(nouveau.aborted).toBe(false);
  });

  it("double clic : un seul contrôleur et une seule série d'envois", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/x.jpg", media_type: "image" });
    const attente = deferred<{ id: string }>();
    createFeedPost.mockReturnValue(attente.promise);
    await monterAvecTexte();
    await selectionner([image("a.jpg"), image("b.jpg")]);

    const bouton = boutonPublier();
    act(() => {
      fireEvent.click(bouton);
      fireEvent.click(bouton);
    });
    await waitFor(() => expect(uploadPostMedia).toHaveBeenCalledTimes(2));

    expect(uploadPostMedia).toHaveBeenCalledTimes(2);
    expect(new Set(uploadPostMedia.mock.calls.map((a) => a[1])).size).toBe(1);
    await act(async () => {
      attente.resolve({ id: "p1" });
      await attente.promise;
    });
    expect(createFeedPost).toHaveBeenCalledTimes(1);
  });
});
