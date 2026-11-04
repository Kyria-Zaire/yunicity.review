// @vitest-environment jsdom

/**
 * MEDIA-01 — cinquième parcours de publication : `/feed/new`.
 *
 * Route active (`app/feed/new/page.tsx`, exposée par le hub de création), donc
 * dans le périmètre MEDIA-01. Les garanties exigées sont les mêmes que pour les
 * quatre autres composers : abandon, budget de temps, verrou synchrone, cycle
 * de vie des object URL, contrat MIME et mapping d'erreurs.
 *
 * ⚠️ **Adapté par FEED-NEW-UX-01 (tâche 9).** L'écran a basculé sur
 * `useNewPostDraft` + `useNewPostPublication`, et sa composition unique a
 * remplacé les deux vues départagées par CSS. Chaque acquis listé ci-dessus est
 * **conservé**, avec de nouveaux sélecteurs et de nouveaux libellés.
 *
 * **Un seul comportement change volontairement** : le réessai après un échec
 * d'envoi ne renvoie plus tout le lot, mais seulement ce qui manque. C'est
 * l'objet de la tâche 4 ; le test correspondant le dit explicitement.
 */

import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import {
  AuthError,
  COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
  COMPOSER_MEDIA_RATE_LIMITED,
  COMPOSER_MEDIA_SERVER_FAILED,
  composerMediaUploadTimeoutMs,
} from "@yunicity/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { NewPostScreen } from "@/components/feed/post-composer/new-post-screen";
import { useNewPostDraft } from "@/hooks/use-new-post-draft";

const uploadPostMedia = vi.fn();
const createFeedPost = vi.fn();
const getProfileMe = vi.fn();

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({ uploadPostMedia, createFeedPost, getProfileMe }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: { id: "compte-a", email: "citoyen@exemple.test" } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => "/feed/new",
}));

vi.mock("@/components/feed/post-composer/new-post-shell", () => ({
  NewPostShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/profile-avatar", () => ({ ProfileAvatar: () => null }));

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

function video(name = "clip.mp4", type = "video/mp4", size = 3): File {
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
  window.sessionStorage.clear();
  vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Saisit le texte et joint des fichiers, puis rend la main. */
async function preparer(fichiers: File[] = [image()]): Promise<void> {
  render(<NewPostScreen />);
  // Une SEULE zone de saisie désormais : la composition est unique.
  const zone = await screen.findByLabelText(/Quoi de neuf à/i);
  fireEvent.change(zone, { target: { value: "Bonjour Reims" } });
  await selectionner(fichiers);
}

async function monterAvecTexte(): Promise<void> {
  render(<NewPostScreen />);
  const zone = await screen.findByLabelText(/Quoi de neuf à/i);
  fireEvent.change(zone, { target: { value: "Bonjour Reims" } });
}

async function selectionner(fichiers: File[]): Promise<void> {
  const entree = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(entree, { target: { files: fichiers } });
  });
}

/** L'unique bouton « Publier », qui doit être actionnable. */
function boutonPublier(): HTMLElement {
  const bouton = screen.getByRole("button", { name: /^Publier$/i });
  expect((bouton as HTMLButtonElement).disabled, "bouton Publier désactivé").toBe(false);
  return bouton;
}

// ───────────── Acquis testés sur le HOOK : inchangés par la tâche 9

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
      await result.current.handleSelectedFiles([
        image("a.jpg"),
        image("b.jpg"),
      ] as unknown as FileList);
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
    await act(async () => {
      await result.current.handleSelectedFiles([video()] as unknown as FileList);
    });
    expect(result.current.selectedMedia).toHaveLength(1);
    expect(result.current.selectedMedia[0]!.mediaType).toBe("video");
  });
});

// ───────────── Acquis testés sur l'ÉCRAN : sélecteurs adaptés à la tâche 9

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

    // Un 500 laisse l'issue INDÉTERMINÉE (§3.4 bis) : l'action primaire est le
    // rejeu, sous la même clé. Deux clics ne produisent qu'une tentative.
    const reessayer = await screen.findByRole("button", { name: "Réessayer l'envoi" });
    await act(async () => {
      fireEvent.click(reessayer);
      fireEvent.click(reessayer);
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
    const alerte = await screen.findByRole("alert");
    expect(alerte.textContent).toContain(COMPOSER_MEDIA_RATE_LIMITED);
  });

  it("5xx annonce une indisponibilité de service", async () => {
    uploadPostMedia.mockRejectedValue(new AuthError("UNKNOWN_ERROR", "brut", 503));
    await preparer();
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const alerte = await screen.findByRole("alert");
    expect(alerte.textContent).toContain(COMPOSER_MEDIA_SERVER_FAILED);
  });

  it("n'expose jamais la réponse brute", async () => {
    const secret = "r2://bucket/cle-privee?X-Amz-Signature=abc";
    uploadPostMedia.mockRejectedValue(new AuthError("UNKNOWN_ERROR", secret, 500));
    await preparer();
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const alerte = await screen.findByRole("alert");
    expect(alerte.textContent?.length ?? 0).toBeGreaterThan(0);
    expect(alerte.textContent).not.toContain("bucket");
    expect(alerte.textContent).not.toContain("X-Amz-Signature");
  });
});

describe("média refusé : décision explicite exigée ici aussi", () => {
  it("le refus est ANNONCÉ, nommé, pas silencieux", async () => {
    await monterAvecTexte();
    await selectionner([image("IMG.HEIC", "image/heic")]);

    // Désormais chaque fichier est nommé avec SON motif, au lieu d'un message
    // unique qui écrasait les précédents.
    expect(await screen.findByText("1 fichier n'a pas été ajouté")).toBeTruthy();
    expect(screen.getByText(/IMG\.HEIC/)).toBeTruthy();
    expect(screen.getByText(new RegExp(COMPOSER_MEDIA_HEIC_NOT_SUPPORTED.slice(0, 20)))).toBeTruthy();
  });

  it("bloque la publication tant que le refus n'est pas arbitré", async () => {
    await monterAvecTexte();
    await selectionner([image("IMG.HEIC", "image/heic")]);

    expect(
      (screen.getByRole("button", { name: /^Publier$/i }) as HTMLButtonElement).disabled,
    ).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Publier$/i }));
    });
    expect(createFeedPost).not.toHaveBeenCalled();
    expect(uploadPostMedia).not.toHaveBeenCalled();
  });

  it("« Continuer sans eux » débloque et conserve le texte", async () => {
    await monterAvecTexte();
    await selectionner([image("IMG.HEIC", "image/heic")]);

    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /Continuer sans eux/i }));
    });
    // L'arbitrage seul ne publie rien.
    expect(createFeedPost).not.toHaveBeenCalled();

    expect((screen.getByLabelText(/Quoi de neuf à/i) as HTMLTextAreaElement).value).toBe(
      "Bonjour Reims",
    );

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).not.toHaveBeenCalled();
  });

  it("choisir une image valide lève le blocage et efface l'annonce", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([image("IMG.HEIC", "image/heic")]);
    await screen.findByText("1 fichier n'a pas été ajouté");

    await selectionner([image("ok.jpg")]);
    expect(screen.queryByText(/n'a pas été ajouté/)).toBeNull();

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
  });
});

describe("arbitrage d'une sélection multiple — libellé conforme au comportement", () => {
  it("image valide + HEIC : la valide est conservée, l'arbitrage reste exigé", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([image("ok.jpg"), image("IMG.HEIC", "image/heic")]);

    expect(await screen.findByRole("button", { name: /Continuer sans eux/i })).toBeTruthy();
    // Rien ne part avant arbitrage.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Publier$/i }));
    });
    expect(createFeedPost).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continuer sans eux/i }));
    });
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
      await screen.findByText(/Les médias déjà sélectionnés restent attachés/i),
    ).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continuer sans eux/i }));
    });
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(2);
  });

  it("vidéo valide + fichier invalide : la vidéo est conservée, sans onglet de format", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/clip.mp4", media_type: "video" });
    await monterAvecTexte();
    // Plus aucun onglet ne décide : le format se DÉDUIT du lot joint.
    await selectionner([video(), image("doc.pdf", "application/pdf")]);

    const bouton = await screen.findByRole("button", { name: /Continuer sans eux/i });
    await act(async () => {
      fireEvent.click(bouton);
    });
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
    expect((uploadPostMedia.mock.calls[0]![0] as File).name).toBe("clip.mp4");
    expect(createFeedPost.mock.calls[0]![0]).toMatchObject({ post_format: "video" });
  });

  it("plusieurs fichiers refusés : le pluriel reste vrai et aucun n'est attaché", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([
      image("ok.jpg"),
      image("IMG.HEIC", "image/heic"),
      image("doc.pdf", "application/pdf"),
    ]);

    expect(await screen.findByText("2 fichiers n'ont pas été ajoutés")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continuer sans eux/i }));
    });
    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
  });

  it("aucun média valide restant : le texte est conservé et publiable", async () => {
    await monterAvecTexte();
    await selectionner([image("IMG.HEIC", "image/heic")]);

    expect(await screen.findByRole("button", { name: /Continuer sans eux/i })).toBeTruthy();
    expect(screen.getByText(/Rien n'a été retiré de votre brouillon/i)).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Continuer sans eux/i }));
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
  it("le deuxième envoi échoue : sélection conservée, aucun post, et la REPRISE ne renvoie que ce qui manque", async () => {
    uploadPostMedia
      .mockResolvedValueOnce({ url: "/m/a.jpg", media_type: "image" })
      .mockRejectedValueOnce(new AuthError("UNKNOWN_ERROR", "brut", 503))
      .mockResolvedValue({ url: "/m/ok.jpg", media_type: "image" });
    await monterAvecTexte();
    await selectionner([image("a.jpg"), image("b.jpg")]);

    await act(async () => {
      fireEvent.click(boutonPublier());
    });
    const alerte = await screen.findByRole("alert");
    expect(alerte.textContent).toContain(COMPOSER_MEDIA_SERVER_FAILED);
    // Ce n'est PAS une validation : aucun arbitrage ne doit apparaître.
    expect(screen.queryByRole("button", { name: /Continuer sans eux/i })).toBeNull();
    expect(createFeedPost).not.toHaveBeenCalled();
    // La sélection entière est intacte : les deux aperçus restent affichés.
    expect(screen.getAllByRole("presentation")).toHaveLength(2);

    uploadPostMedia.mockClear();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Réessayer l'envoi" }));
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));

    /**
     * ⚠️ **Comportement volontairement changé par FEED-NEW-UX-01 (tâche 4).**
     * L'ancien écran renvoyait les DEUX fichiers, y compris `a.jpg` déjà
     * transféré — une facture réseau doublée et un risque de doublon côté
     * stockage. La reprise n'envoie plus que `b.jpg`.
     */
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
    expect((uploadPostMedia.mock.calls[0]![0] as File).name).toBe("b.jpg");
    const payload = createFeedPost.mock.calls[0]![0] as { media_urls: { url: string }[] };
    expect(payload.media_urls).toHaveLength(2);
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
    await screen.findByRole("alert");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Réessayer l'envoi" }));
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
      fireEvent.click(await screen.findByRole("button", { name: "Réessayer l'envoi" }));
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
      fireEvent.click(await screen.findByRole("button", { name: "Réessayer l'envoi" }));
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
