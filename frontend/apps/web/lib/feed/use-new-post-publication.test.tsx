// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — envoi d'une publication : reprise, verrou, clé d'idempotence.
 *
 * Ce que l'écran actuel fait mal et que ces tests verrouillent :
 *   - un échec d'envoi était attribué au LOT, pas au fichier concerné ;
 *   - un réessai renvoyait TOUS les médias, y compris ceux déjà transférés ;
 *   - une réponse perdue après un envoi réussi créait une seconde publication.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNewPostDraft } from "@/hooks/use-new-post-draft";
import { useNewPostPublication } from "@/hooks/use-new-post-publication";
import { newClientRequestId } from "@/lib/feed/client-request-id";
import { PENDING_REQUEST_STORAGE_KEY } from "@/lib/feed/pending-request-id";

const uploadPostMedia = vi.fn();
const createFeedPost = vi.fn();
const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({ uploadPostMedia, createFeedPost }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh, back: vi.fn() }),
}));

function fichier(name: string): File {
  return new File(["x"], name, { type: "image/jpeg" });
}

function liste(...files: File[]): FileList {
  // `FileList` n'est pas constructible et jsdom n'implémente pas `DataTransfer`
  // de façon fiable : le double cast est la convention locale pour fabriquer la
  // forme attendue, et reste confiné aux tests. ⛔ Jamais en code de production.
  return {
    ...files,
    length: files.length,
    item: (i: number) => files[i] ?? null,
  } as unknown as FileList;
}

beforeEach(() => {
  vi.clearAllMocks();
  // La clé en attente vit en `sessionStorage` : chaque test repart vierge, sinon
  // une tentative indéterminée contaminerait la suivante.
  window.sessionStorage.clear();
  globalThis.URL.createObjectURL = vi.fn(() => "blob:apercu");
  globalThis.URL.revokeObjectURL = vi.fn();
});

/** Erreur applicative du projet : porte `status`, et parfois `code`. */
function erreurServeur(status: number, code?: string): Error {
  return Object.assign(
    new Error(`statut ${status}`),
    code === undefined ? { status } : { status, code },
  );
}

function composeur(accountId = "compte-a") {
  return renderHook(() => {
    const draft = useNewPostDraft("Reims");
    return { draft, publication: useNewPostPublication(draft, accountId) };
  });
}

describe("échec attribué au bon fichier", () => {
  it("attribue l'échec au fichier concerné, pas au lot", async () => {
    uploadPostMedia
      .mockResolvedValueOnce({ url: "https://cdn/1.jpg", media_type: "image" })
      .mockRejectedValueOnce(new Error("network"));
    const { result } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("un.jpg"), fichier("deux.jpg"))));
    act(() => result.current.publication.publish());

    await waitFor(() => {
      expect(result.current.publication.state.kind).toBe("failed");
    });
    const deuxieme = result.current.draft.medias[1]!;
    expect(deuxieme.status.kind).toBe("failed");
    expect(result.current.draft.medias[0]!.status.kind).toBe("uploaded");
  });
});

describe("reprise : seul ce qui manque repart", () => {
  it("le réessai n'envoie QUE ce qui manque", async () => {
    uploadPostMedia
      .mockResolvedValueOnce({ url: "https://cdn/1.jpg", media_type: "image" })
      .mockResolvedValueOnce({ url: "https://cdn/2.jpg", media_type: "image" })
      .mockRejectedValueOnce(new Error("network"));
    const { result } = composeur();
    act(() =>
      result.current.draft.addFiles(liste(fichier("1.jpg"), fichier("2.jpg"), fichier("3.jpg"))),
    );
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
    expect(uploadPostMedia).toHaveBeenCalledTimes(3);

    uploadPostMedia.mockResolvedValueOnce({ url: "https://cdn/3.jpg", media_type: "image" });
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    // 3 au premier essai + 1 seul au réessai : les deux premiers ne repartent pas.
    expect(uploadPostMedia).toHaveBeenCalledTimes(4);

    // Les URL des médias envoyés AVANT l'échec doivent figurer au payload.
    // Les lire depuis l'état donnerait un tableau vide.
    const payload = createFeedPost.mock.calls[0]![0] as { media_urls: { url: string }[] };
    expect(payload.media_urls.map((m) => m.url)).toEqual([
      "https://cdn/1.jpg",
      "https://cdn/2.jpg",
      "https://cdn/3.jpg",
    ]);
  });

  it("tous médias envoyés mais création en échec : le réessai ne renvoie AUCUN fichier", async () => {
    uploadPostMedia.mockResolvedValue({ url: "https://cdn/1.jpg", media_type: "image" });
    createFeedPost.mockRejectedValueOnce(erreurServeur(400));
    const { result } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("1.jpg"))));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);

    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
  });

  it("un 429 au milieu du lot conserve les médias déjà envoyés", async () => {
    const limite = Object.assign(new Error("rate"), { status: 429 });
    uploadPostMedia
      .mockResolvedValueOnce({ url: "https://cdn/1.jpg", media_type: "image" })
      .mockRejectedValueOnce(limite);
    const { result } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("1.jpg"), fichier("2.jpg"))));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
    expect(result.current.draft.medias[0]!.status.kind).toBe("uploaded");
  });
});

describe("verrou et démontage", () => {
  it("deux appels dans le même tick ne font qu'une tentative", async () => {
    uploadPostMedia.mockResolvedValue({ url: "https://cdn/1.jpg", media_type: "image" });
    createFeedPost.mockResolvedValue({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => {
      result.current.publication.publish();
      result.current.publication.publish();
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
  });

  it("le démontage pendant l'envoi n'écrit plus d'état", async () => {
    let resoudre: ((v: unknown) => void) | null = null;
    uploadPostMedia.mockImplementation(
      () =>
        new Promise((r) => {
          resoudre = r;
        }),
    );
    const { result, unmount } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("1.jpg"))));
    act(() => result.current.publication.publish());
    const erreurs: unknown[] = [];
    const espion = vi.spyOn(console, "error").mockImplementation((e) => erreurs.push(e));
    unmount();
    act(() => {
      resoudre?.({ url: "https://cdn/1.jpg", media_type: "image" });
    });
    await waitFor(() => expect(erreurs).toHaveLength(0));
    expect(createFeedPost).not.toHaveBeenCalled();
    espion.mockRestore();
  });

  it("le démontage abandonne l'envoi en vol", async () => {
    uploadPostMedia.mockImplementation(() => new Promise(() => undefined));
    const { result, unmount } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("1.jpg"))));
    act(() => result.current.publication.publish());
    const [, signal] = uploadPostMedia.mock.calls[0]! as [File, AbortSignal];
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
});

describe("instantané du lot", () => {
  it("un média ajouté pendant l'envoi n'est pas envoyé par cette tentative", async () => {
    let resoudre: ((v: unknown) => void) | null = null;
    uploadPostMedia.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resoudre = r;
        }),
    );
    const { result } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("1.jpg"))));
    act(() => result.current.publication.publish());
    act(() => result.current.draft.addFiles(liste(fichier("tardif.jpg"))));
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    act(() => {
      resoudre?.({ url: "https://cdn/1.jpg", media_type: "image" });
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
    // Le média tardif reste dans le brouillon, à l'état `selected`.
    expect(result.current.draft.medias[1]!.status.kind).toBe("selected");
  });
});

describe("clé d'idempotence", () => {
  it("réutilise LA MÊME clé entre deux tentatives de la même publication", async () => {
    // 400 : le serveur a répondu, et la clé est CONSERVÉE (§3.4 bis c).
    createFeedPost.mockRejectedValueOnce(erreurServeur(400)).mockResolvedValueOnce({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));

    const premiere = createFeedPost.mock.calls[0]![0] as { client_request_id: string };
    const seconde = createFeedPost.mock.calls[1]![0] as { client_request_id: string };
    expect(seconde.client_request_id).toBe(premiere.client_request_id);
    expect(premiere.client_request_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("renouvelle la clé après un succès : la publication suivante est neuve", async () => {
    createFeedPost.mockResolvedValue({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));

    const premiere = createFeedPost.mock.calls[0]![0] as { client_request_id: string };
    const seconde = createFeedPost.mock.calls[1]![0] as { client_request_id: string };
    expect(seconde.client_request_id).not.toBe(premiere.client_request_id);
  });

  it("un 409 n'est PAS rejouable : l'écran dit que la publication est partie", async () => {
    const conflit = Object.assign(new Error("conflit"), {
      status: 409,
      code: "POST_REQUEST_CONFLICT",
    });
    createFeedPost.mockRejectedValueOnce(conflit);
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("already_sent"));
  });
});

/**
 * §3.4 bis du contrat — l'issue INDÉTERMINÉE.
 *
 * ⛔ Conservation par défaut, renouvellement sur PREUVE de chemin serveur.
 * Conserver une clé à tort coûte un rejeu ou un 409 ; la renouveler à tort
 * coûte un doublon irréparable.
 */
describe("issue indéterminée", () => {
  async function cleDeLaTentative(indice: number): Promise<string | null> {
    const appel = createFeedPost.mock.calls[indice]![0] as { client_request_id: string | null };
    return appel.client_request_id;
  }

  it("aucune réponse : n'annonce PAS un échec", async () => {
    createFeedPost.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("undetermined"));
  });

  it("5xx : indéterminé, car un échec après commit reste possible", async () => {
    createFeedPost.mockRejectedValueOnce(erreurServeur(503));
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("undetermined"));
  });

  it("après une issue indéterminée, le rejeu garde LA MÊME clé", async () => {
    createFeedPost
      .mockRejectedValueOnce(erreurServeur(503))
      .mockResolvedValueOnce({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("undetermined"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));

    expect(await cleDeLaTentative(1)).toBe(await cleDeLaTentative(0));
  });

  it("une clé en attente survit au démontage de l'écran", async () => {
    createFeedPost.mockRejectedValueOnce(erreurServeur(503));
    const premier = composeur();
    act(() => premier.result.current.draft.setBody("Bonjour Reims"));
    act(() => premier.result.current.publication.publish());
    await waitFor(() => expect(premier.result.current.publication.state.kind).toBe("undetermined"));
    const cleAvant = await cleDeLaTentative(0);
    premier.unmount();

    // Écran rouvert : la clé est retrouvée, et SEULE la clé.
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    const second = composeur();
    expect(second.result.current.publication.recoveredPendingKey).toBe(true);
    expect(second.result.current.draft.body).toBe("");
    expect(second.result.current.draft.medias).toHaveLength(0);

    act(() => second.result.current.draft.setBody("Bonjour Reims"));
    act(() => second.result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));
    expect(await cleDeLaTentative(1)).toBe(cleAvant);
  });

  it("422 et 429 renouvellent la clé : la requête n'a jamais atteint le service", async () => {
    for (const statut of [422, 429]) {
      createFeedPost.mockReset();
      createFeedPost
        .mockRejectedValueOnce(erreurServeur(statut))
        .mockResolvedValueOnce({ id: "post-1" });
      const { result, unmount } = composeur();
      act(() => result.current.draft.setBody("Bonjour Reims"));
      act(() => result.current.publication.publish());
      await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
      act(() => result.current.publication.publish());
      await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));

      expect(await cleDeLaTentative(1), `statut ${statut}`).not.toBe(await cleDeLaTentative(0));
      unmount();
    }
  });

  it("400 et 403 CONSERVENT la clé : le client ne parie pas sur l'emplacement d'un raise", async () => {
    for (const statut of [400, 403, 404]) {
      createFeedPost.mockReset();
      createFeedPost
        .mockRejectedValueOnce(erreurServeur(statut))
        .mockResolvedValueOnce({ id: "post-1" });
      const { result, unmount } = composeur();
      act(() => result.current.draft.setBody("Bonjour Reims"));
      act(() => result.current.publication.publish());
      await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
      act(() => result.current.publication.publish());
      await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));

      expect(await cleDeLaTentative(1), `statut ${statut}`).toBe(await cleDeLaTentative(0));
      unmount();
    }
  });

  it("un 409 ne libère la clé que sur un geste EXPLICITE", async () => {
    const conflit = erreurServeur(409, "POST_REQUEST_CONFLICT");
    createFeedPost.mockRejectedValueOnce(conflit).mockResolvedValue({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("already_sent"));

    // ⛔ Aucune republication automatique : rien ne repart tout seul.
    expect(createFeedPost).toHaveBeenCalledTimes(1);

    // Le geste explicite libère la clé ET rend l'écran publiable à neuf.
    act(() => result.current.publication.startNewPublication());
    expect(result.current.publication.state.kind).toBe("idle");
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));
    expect(await cleDeLaTentative(1)).not.toBe(await cleDeLaTentative(0));
  });

  it("une clé d'un autre compte n'est jamais reprise", async () => {
    createFeedPost.mockRejectedValueOnce(erreurServeur(503));
    const premier = composeur("compte-a");
    act(() => premier.result.current.draft.setBody("Bonjour Reims"));
    act(() => premier.result.current.publication.publish());
    await waitFor(() => expect(premier.result.current.publication.state.kind).toBe("undetermined"));
    const cleDeA = await cleDeLaTentative(0);
    premier.unmount();

    createFeedPost.mockResolvedValueOnce({ id: "post-2" });
    const second = composeur("compte-b");
    expect(second.result.current.publication.recoveredPendingKey).toBe(false);
    act(() => second.result.current.draft.setBody("Bonjour Reims"));
    act(() => second.result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));
    expect(await cleDeLaTentative(1)).not.toBe(cleDeA);
  });

  it("un succès efface la clé en attente", async () => {
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("done"));
    expect(window.sessionStorage.getItem(PENDING_REQUEST_STORAGE_KEY)).toBeNull();
  });
});

describe("clé d'idempotence — repli hors contexte sécurisé", () => {
  it("frappe un UUID v4 quand `randomUUID` manque, sans Math.random", () => {
    const octets = new Uint8Array(16).fill(0xab);
    vi.stubGlobal("crypto", {
      getRandomValues: <T extends ArrayBufferView>(cible: T): T => {
        new Uint8Array(cible.buffer).set(octets);
        return cible;
      },
    });
    try {
      const cle = newClientRequestId();
      expect(cle).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rend null sans source cryptographique : le champ part absent", () => {
    vi.stubGlobal("crypto", undefined);
    try {
      expect(newClientRequestId()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

/**
 * Revue finale FEED-NEW-UX-01 — I1, I3, I8.
 */
describe("I1 — la clé ne repart pas tant qu'une issue est restée inconnue", () => {
  it("503 puis 429 puis succès : les trois tentatives portent la MÊME clé", async () => {
    createFeedPost
      .mockRejectedValueOnce(erreurServeur(503))
      .mockRejectedValueOnce(erreurServeur(429))
      .mockResolvedValueOnce({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("undetermined"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(3));

    const cles = createFeedPost.mock.calls.map(
      (appel) => (appel[0] as { client_request_id: string | null }).client_request_id,
    );
    expect(cles[1]).toBe(cles[0]);
    expect(cles[2]).toBe(cles[0]);
  });

  it("une clé retrouvée après rechargement n'est pas libérée par un 429", async () => {
    createFeedPost.mockRejectedValueOnce(erreurServeur(503));
    const premier = composeur();
    act(() => premier.result.current.draft.setBody("Bonjour Reims"));
    act(() => premier.result.current.publication.publish());
    await waitFor(() => expect(premier.result.current.publication.state.kind).toBe("undetermined"));
    const cleAvant = (createFeedPost.mock.calls[0]![0] as { client_request_id: string }).client_request_id;
    premier.unmount();

    createFeedPost.mockRejectedValueOnce(erreurServeur(429)).mockResolvedValueOnce({ id: "post-1" });
    const second = composeur();
    act(() => second.result.current.draft.setBody("Bonjour Reims"));
    act(() => second.result.current.publication.publish());
    await waitFor(() => expect(second.result.current.publication.state.kind).toBe("failed"));
    act(() => second.result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(3));
    expect((createFeedPost.mock.calls[2]![0] as { client_request_id: string }).client_request_id).toBe(
      cleAvant,
    );
  });
});

describe("I3 — la création a une échéance", () => {
  it("sans réponse, l'écran passe en issue indéterminée au lieu de rester figé", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      createFeedPost.mockImplementationOnce(
        (_payload: unknown, signal?: AbortSignal) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      );
      const { result } = composeur();
      act(() => result.current.draft.setBody("Bonjour Reims"));
      act(() => result.current.publication.publish());
      await waitFor(() => expect(result.current.publication.state.kind).toBe("creating"));
      expect(createFeedPost.mock.calls[0]![1]).toBeInstanceOf(AbortSignal);

      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await waitFor(() => expect(result.current.publication.state.kind).toBe("undetermined"));
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("I8 — un média retiré pendant l'envoi n'est ni envoyé ni publié", () => {
  it("retiré avant son tour : jamais envoyé, absent du payload", async () => {
    let libererPremier: (valeur: { url: string; media_type: "image" }) => void = () => {};
    uploadPostMedia.mockImplementationOnce(
      () => new Promise((resolve) => (libererPremier = resolve)),
    );
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("a.jpg"), fichier("b.jpg"))));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(uploadPostMedia).toHaveBeenCalledTimes(1));

    act(() => result.current.draft.removeMedia(result.current.draft.medias[1]!.id));
    await act(async () => libererPremier({ url: "https://cdn/a.jpg", media_type: "image" }));

    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
    const payload = createFeedPost.mock.calls[0]![0] as { media_urls: { url: string }[] };
    expect(payload.media_urls.map((m) => m.url)).toEqual(["https://cdn/a.jpg"]);
  });

  it("retiré pendant SON envoi : l'URL revenue n'est pas publiée", async () => {
    let libererSecond: (valeur: { url: string; media_type: "image" }) => void = () => {};
    uploadPostMedia
      .mockResolvedValueOnce({ url: "https://cdn/a.jpg", media_type: "image" })
      .mockImplementationOnce(() => new Promise((resolve) => (libererSecond = resolve)));
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("a.jpg"), fichier("b.jpg"))));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(uploadPostMedia).toHaveBeenCalledTimes(2));

    act(() => result.current.draft.removeMedia(result.current.draft.medias[1]!.id));
    await act(async () => libererSecond({ url: "https://cdn/b.jpg", media_type: "image" }));

    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    const payload = createFeedPost.mock.calls[0]![0] as { media_urls: { url: string }[] };
    expect(payload.media_urls.map((m) => m.url)).toEqual(["https://cdn/a.jpg"]);
  });

  it("l'ordre publié suit l'ordre VISIBLE, même après une reprise", async () => {
    uploadPostMedia
      .mockResolvedValueOnce({ url: "https://cdn/a.jpg", media_type: "image" })
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ url: "https://cdn/b.jpg", media_type: "image" });
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("a.jpg"), fichier("b.jpg"))));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));

    act(() => {
      result.current.draft.moveMedia(result.current.draft.medias[1]!.id, "first");
    });
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    const payload = createFeedPost.mock.calls[0]![0] as { media_urls: { url: string }[] };
    expect(payload.media_urls.map((m) => m.url)).toEqual(["https://cdn/b.jpg", "https://cdn/a.jpg"]);
  });
});

/**
 * Décision de Kyria du 2026-11-04 — le contenu soumis est FIGÉ, et une même
 * clé ne sert jamais à envoyer un contenu modifié.
 */
describe("contenu figé et clé liée au contenu", () => {
  it("issue indéterminée : le contenu est figé", async () => {
    createFeedPost.mockRejectedValueOnce(erreurServeur(503));
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    expect(result.current.publication.contentLocked).toBe(false);
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("undetermined"));
    expect(result.current.publication.contentLocked).toBe(true);
  });

  it("un échec APRÈS une issue inconnue reste figé (la clé est incertaine)", async () => {
    createFeedPost
      .mockRejectedValueOnce(erreurServeur(503))
      .mockRejectedValueOnce(erreurServeur(429));
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("undetermined"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
    expect(result.current.publication.contentLocked).toBe(true);
  });

  it("un échec d'envoi de MÉDIA sans incertitude laisse le contenu modifiable", async () => {
    uploadPostMedia.mockRejectedValueOnce(new Error("network"));
    const { result } = composeur();
    act(() => result.current.draft.addFiles(liste(fichier("a.jpg"))));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
    expect(result.current.publication.contentLocked).toBe(false);
  });

  it("contenu modifié sans incertitude : la tentative suivante part sous une clé NEUVE", async () => {
    createFeedPost
      .mockRejectedValueOnce(erreurServeur(400))
      .mockResolvedValueOnce({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
    act(() => result.current.draft.setBody("Bonjour Reims, corrigé"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));
    const cles = createFeedPost.mock.calls.map(
      (appel) => (appel[0] as { client_request_id: string | null }).client_request_id,
    );
    expect(cles[1]).not.toBe(cles[0]);
  });

  it("contenu inchangé : la MÊME clé est rejouée", async () => {
    createFeedPost
      .mockRejectedValueOnce(erreurServeur(400))
      .mockResolvedValueOnce({ id: "post-1" });
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("failed"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(2));
    const cles = createFeedPost.mock.calls.map(
      (appel) => (appel[0] as { client_request_id: string | null }).client_request_id,
    );
    expect(cles[1]).toBe(cles[0]);
  });

  it("⛔ contenu modifié sous une clé incertaine : RIEN ne part", async () => {
    createFeedPost.mockRejectedValueOnce(erreurServeur(503));
    const { result } = composeur();
    act(() => result.current.draft.setBody("Bonjour Reims"));
    act(() => result.current.publication.publish());
    await waitFor(() => expect(result.current.publication.state.kind).toBe("undetermined"));

    // L'écran fige le champ ; le hook se défend seul si l'écran faillit.
    act(() => result.current.draft.setBody("Contenu différent"));
    act(() => result.current.publication.publish());
    expect(createFeedPost).toHaveBeenCalledTimes(1);
    expect(result.current.publication.state.kind).toBe("undetermined");
  });
});
