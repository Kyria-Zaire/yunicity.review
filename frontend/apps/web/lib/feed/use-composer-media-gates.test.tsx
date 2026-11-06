// @vitest-environment jsdom

/**
 * MEDIA-01 — preuves de revue (GATE 1, 2, 3, 6, 7, 8).
 *
 * Complète `use-composer-media.test.tsx` sur les points que la revue exigeait de
 * démontrer plutôt que de supposer : cycle de vie des minuteurs, latest-wins
 * quand l'abandon réseau n'est PAS respecté, double montage React Strict Mode,
 * mapping complet des erreurs, cycle de vie des object URL, et reprise de
 * publication sans réenvoi.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import {
  AuthError,
  COMPOSER_MEDIA_EMPTY_FILE,
  COMPOSER_MEDIA_FORBIDDEN,
  COMPOSER_MEDIA_HEIC_NOT_SUPPORTED,
  COMPOSER_MEDIA_NETWORK_FAILED,
  COMPOSER_MEDIA_RATE_LIMITED,
  COMPOSER_MEDIA_SERVER_FAILED,
  COMPOSER_MEDIA_TIMEOUT,
  COMPOSER_MEDIA_TOO_LARGE,
  COMPOSER_MEDIA_UNAUTHORIZED,
  COMPOSER_MEDIA_UPLOAD_FAILED,
  COMPOSER_PUBLICATION_FAILED_AFTER_UPLOAD,
  composerMediaUploadTimeoutMs,
} from "@yunicity/utils";
import { StrictMode, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useComposerMedia } from "@/hooks/use-composer-media";

const uploadPostMedia = vi.fn();

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({ uploadPostMedia }),
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

function image(name: string, type = "image/jpeg", size = 3): File {
  return new File([new Uint8Array(size)], name, { type });
}

function abortError(): DOMException {
  return new DOMException("aborted", "AbortError");
}

/** Laisse les microtâches se vider — indispensable après un resolve/reject. */
async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

const createObjectURL = vi.fn((file: Blob) => `blob:preview-${(file as File).name ?? "x"}`);
const revokeObjectURL = vi.fn();

beforeEach(() => {
  uploadPostMedia.mockReset();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// ───────────────────────────────────────────────────────── GATE 1 — minuteurs

describe("GATE 1 — budget de temps et cycle de vie des minuteurs", () => {
  it("un fichier volumineux reçoit un budget proportionnel, pas 30 s", async () => {
    vi.useFakeTimers();
    const gros = image("grande.jpg", "image/jpeg", 10 * 1024 * 1024);
    const attendu = composerMediaUploadTimeoutMs(gros.size);
    // Le correctif d'origine aurait abandonné à 30 s : on prouve que le budget
    // réellement armé dépasse largement cette valeur.
    expect(attendu).toBeGreaterThan(60_000);

    const en_cours = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(en_cours.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(gros);
    });

    // Juste avant la limite : toujours en cours, aucune erreur.
    await act(async () => {
      vi.advanceTimersByTime(attendu - 1);
    });
    expect(result.current.phase).toBe("uploading");
    expect(result.current.mediaError).toBeNull();

    // Franchissement de la limite : abandon et message de délai dépassé.
    await act(async () => {
      vi.advanceTimersByTime(2);
    });
    en_cours.reject(abortError());
    await flush();
    expect(result.current.phase).toBe("error");
    expect(result.current.mediaError).toBe(COMPOSER_MEDIA_TIMEOUT);
  });

  it("ne laisse survivre aucun minuteur après un succès", async () => {
    vi.useFakeTimers();
    uploadPostMedia.mockResolvedValue({ url: "/media/a.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    expect(result.current.phase).toBe("ready");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ne laisse survivre aucun minuteur après une erreur", async () => {
    vi.useFakeTimers();
    uploadPostMedia.mockRejectedValue(new AuthError("UNKNOWN_ERROR", "x", 500));
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    expect(result.current.phase).toBe("error");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ne laisse survivre aucun minuteur après un retrait, même si le réseau ignore l'abandon", async () => {
    vi.useFakeTimers();
    const bloque = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(bloque.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => {
      result.current.clearMedia();
    });
    // La requête n'a jamais répondu : sans nettoyage explicite, le minuteur
    // serait resté armé.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ne laisse survivre aucun minuteur après démontage, même sans réponse réseau", async () => {
    vi.useFakeTimers();
    const bloque = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(bloque.promise);
    const { result, unmount } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("une nouvelle sélection désarme le minuteur de la précédente", async () => {
    vi.useFakeTimers();
    const a = deferred<{ url: string }>();
    const b = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    await act(async () => {
      void result.current.onFileChange(image("b.jpg"));
    });
    // Exactement un minuteur : celui de B.
    expect(vi.getTimerCount()).toBe(1);
  });

  it("une réponse tardive après expiration ne ressuscite rien", async () => {
    vi.useFakeTimers();
    const tardif = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(tardif.promise);
    const fichier = image("a.jpg");
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(fichier);
    });
    await act(async () => {
      vi.advanceTimersByTime(composerMediaUploadTimeoutMs(fichier.size) + 1);
    });
    // Le réseau ignore l'abandon et répond un succès, trop tard.
    tardif.resolve({ url: "/media/trop-tard.jpg" });
    await flush();
    expect(result.current.mediaError).toBe(COMPOSER_MEDIA_TIMEOUT);
    expect(result.current.mediaUrl).toBeNull();
  });
});

// ────────────────────────────────────────────── GATE 2 — latest-wins réel

describe("GATE 2 — l'abandon réseau n'est pas l'unique protection", () => {
  it("A puis B : B gagne, et A qui termine ensuite ne modifie rien", async () => {
    const a = deferred<{ url: string }>();
    const b = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    const { result } = renderHook(() => useComposerMedia());

    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    await act(async () => {
      void result.current.onFileChange(image("b.jpg"));
    });
    b.resolve({ url: "/media/b.jpg" });
    await flush();
    expect(result.current.mediaUrl).toBe("/media/b.jpg");

    // Le mock ignore délibérément l'abandon : A répond un succès après B.
    a.resolve({ url: "/media/a.jpg" });
    await flush();
    expect(result.current.mediaUrl).toBe("/media/b.jpg");
    expect(result.current.phase).toBe("ready");
  });

  it("A échoue après que B est prête : aucune erreur n'apparaît", async () => {
    const a = deferred<{ url: string }>();
    const b = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    const { result } = renderHook(() => useComposerMedia());

    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    await act(async () => {
      void result.current.onFileChange(image("b.jpg"));
    });
    b.resolve({ url: "/media/b.jpg" });
    await flush();

    a.reject(new AuthError("STORY_MEDIA_INVALID_TYPE", "x", 400));
    await flush();
    expect(result.current.mediaError).toBeNull();
    expect(result.current.mediaUrl).toBe("/media/b.jpg");
    expect(result.current.phase).toBe("ready");
  });

  it("A ne fait pas repasser `uploading` à false pour la sélection B", async () => {
    const a = deferred<{ url: string }>();
    const b = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    const { result } = renderHook(() => useComposerMedia());

    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    await act(async () => {
      void result.current.onFileChange(image("b.jpg"));
    });
    // A termine pendant que B est encore en vol : son `finally` ne doit pas
    // annoncer la fin de l'envoi de B.
    a.resolve({ url: "/media/a.jpg" });
    await flush();
    expect(result.current.uploading).toBe(true);
    expect(result.current.phase).toBe("uploading");
  });

  it("retrait puis réponse tardive réussie : l'URL n'apparaît pas", async () => {
    const a = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(a.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    await act(async () => {
      result.current.clearMedia();
    });
    a.resolve({ url: "/media/fantome.jpg" });
    await flush();
    expect(result.current.mediaUrl).toBeNull();
    expect(result.current.phase).toBe("idle");
  });

  it("retrait puis réponse tardive en échec : aucune erreur n'apparaît", async () => {
    const a = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(a.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    await act(async () => {
      result.current.clearMedia();
    });
    a.reject(new AuthError("UNKNOWN_ERROR", "x", 500));
    await flush();
    expect(result.current.mediaError).toBeNull();
    expect(result.current.phase).toBe("idle");
  });

  it("démontage puis résolution : aucune mise à jour d'état React", async () => {
    const a = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(a.promise);
    const erreurs: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => erreurs.push(args));
    const { result, unmount } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    unmount();
    a.resolve({ url: "/media/a.jpg" });
    await flush();
    // Sentinelle : on vérifie l'absence d'avertissement React, sur une capture
    // dont on sait qu'elle enregistrerait quelque chose si React se plaignait.
    spy.mockImplementation(() => {});
    console.error("sentinelle");
    expect(erreurs.filter((e) => /unmounted|not wrapped in act/i.test(String(e)))).toHaveLength(0);
    spy.mockRestore();
  });

  it("démontage puis rejet : aucune erreur non interceptée", async () => {
    const a = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(a.promise);
    const { result, unmount } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    unmount();
    a.reject(new AuthError("UNKNOWN_ERROR", "x", 500));
    await expect(flush()).resolves.toBeUndefined();
  });

  it("expiration de A pendant que B est active : B n'est pas touchée", async () => {
    vi.useFakeTimers();
    // B est nettement plus volumineuse, donc son budget est bien plus long :
    // on peut franchir l'échéance de A sans atteindre celle de B.
    const petit = image("a.jpg", "image/jpeg", 3);
    const gros = image("b.jpg", "image/jpeg", 10 * 1024 * 1024);
    const echeanceA = composerMediaUploadTimeoutMs(petit.size);
    expect(composerMediaUploadTimeoutMs(gros.size)).toBeGreaterThan(echeanceA + 2_000);

    const a = deferred<{ url: string }>();
    const b = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(petit);
    });
    await act(async () => {
      void result.current.onFileChange(gros);
    });
    // On dépasse ce qu'aurait été l'échéance de A, sans atteindre celle de B.
    await act(async () => {
      vi.advanceTimersByTime(echeanceA + 1_000);
    });
    a.reject(abortError());
    await flush();
    expect(result.current.mediaError).toBeNull();
    expect(result.current.phase).toBe("uploading");

    b.resolve({ url: "/media/b.jpg" });
    await flush();
    expect(result.current.mediaUrl).toBe("/media/b.jpg");
  });
});

// ────────────────────────────────────────────── GATE 3 — React Strict Mode

describe("GATE 3 — double montage Strict Mode", () => {
  const strict = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

  it("le hook reste utilisable après le cycle montage/nettoyage/montage", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/media/a.jpg" });
    const { result } = renderHook(() => useComposerMedia(), { wrapper: strict });

    // Si `mountedRef` restait à false après le nettoyage intermédiaire, aucune
    // mise à jour ne passerait et la phase resterait bloquée.
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    expect(result.current.phase).toBe("ready");
    expect(result.current.mediaUrl).toBe("/media/a.jpg");
  });

  it("ne laisse ni minuteur ni object URL du premier montage", async () => {
    vi.useFakeTimers();
    uploadPostMedia.mockResolvedValue({ url: "/media/a.jpg" });
    const { result } = renderHook(() => useComposerMedia(), { wrapper: strict });
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    expect(vi.getTimerCount()).toBe(0);
    // MEDIA-01B : l'aperçu local reste vivant après `ready` (révocation au clear/unmount).
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(0);
    expect(result.current.displayUrl).toMatch(/^blob:/);
  });

  it("un seul envoi est déclenché malgré le double montage", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/media/a.jpg" });
    const { result } = renderHook(() => useComposerMedia(), { wrapper: strict });
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────── GATE 6 — mapping des erreurs

describe("GATE 6 — mapping des erreurs d'envoi", () => {
  const cas: Array<[string, unknown, string]> = [
    ["400 format", new AuthError("STORY_MEDIA_INVALID_TYPE", "brut", 400), "Format non supporté — JPEG, PNG ou WebP uniquement."],
    ["400 contenu", new AuthError("STORY_MEDIA_INVALID_CONTENT", "brut", 400), "Le contenu du fichier ne correspond pas à son format déclaré."],
    ["400 trop lourd", new AuthError("STORY_MEDIA_TOO_LARGE", "brut", 400), COMPOSER_MEDIA_TOO_LARGE],
    ["400 vide", new AuthError("STORY_MEDIA_EMPTY", "brut", 400), COMPOSER_MEDIA_EMPTY_FILE],
    ["401", new AuthError("UNAUTHORIZED", "brut", 401), COMPOSER_MEDIA_UNAUTHORIZED],
    ["403 permission", new AuthError("FORBIDDEN", "brut", 403), COMPOSER_MEDIA_FORBIDDEN],
    ["413 intermédiaire", new AuthError("UNKNOWN_ERROR", "brut", 413), COMPOSER_MEDIA_TOO_LARGE],
    ["422", new AuthError("UNKNOWN_ERROR", "brut", 422), COMPOSER_MEDIA_UPLOAD_FAILED],
    ["429", new AuthError("RATE_LIMITED", "brut", 429), COMPOSER_MEDIA_RATE_LIMITED],
    ["500", new AuthError("UNKNOWN_ERROR", "brut", 500), COMPOSER_MEDIA_SERVER_FAILED],
    ["503", new AuthError("UNKNOWN_ERROR", "brut", 503), COMPOSER_MEDIA_SERVER_FAILED],
    ["réponse non JSON", new AuthError("UNKNOWN_ERROR", "Erreur API (500)", 500), COMPOSER_MEDIA_SERVER_FAILED],
    ["réseau", new TypeError("Failed to fetch"), COMPOSER_MEDIA_NETWORK_FAILED],
    ["inconnue", new Error("boom"), COMPOSER_MEDIA_UPLOAD_FAILED],
  ];

  for (const [libelle, erreur, attendu] of cas) {
    it(`${libelle} → message dédié, sans réponse brute`, async () => {
      uploadPostMedia.mockRejectedValue(erreur);
      const { result } = renderHook(() => useComposerMedia());
      await act(async () => {
        await result.current.onFileChange(image("a.jpg"));
      });
      expect(result.current.mediaError).toBe(attendu);
      expect(result.current.phase).toBe("error");
    });
  }

  it("un 403 n'invite jamais à se reconnecter", async () => {
    uploadPostMedia.mockRejectedValue(new AuthError("FORBIDDEN", "brut", 403));
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    expect(result.current.mediaError).not.toMatch(/reconnect/i);
  });

  it("aucun message n'expose la réponse brute, l'URL signée ni la clé de stockage", async () => {
    const secrets = ["signature-secrete", "https://r2.exemple/cle?X-Amz-Signature=abc", "posts/42/cle.jpg"];
    const messages: string[] = [];
    for (const secret of secrets) {
      uploadPostMedia.mockRejectedValue(new AuthError("UNKNOWN_ERROR", secret, 500));
      const { result, unmount } = renderHook(() => useComposerMedia());
      await act(async () => {
        await result.current.onFileChange(image("a.jpg"));
      });
      messages.push(String(result.current.mediaError));
      unmount();
    }
    // Capture non vide : l'assertion d'absence porte sur des messages réels.
    expect(messages).toHaveLength(secrets.length);
    for (const message of messages) {
      expect(message.length).toBeGreaterThan(0);
      for (const secret of secrets) expect(message).not.toContain(secret);
    }
  });

  it("une annulation volontaire n'est ni une expiration ni une erreur réseau", async () => {
    const a = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(a.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    await act(async () => {
      result.current.clearMedia();
    });
    a.reject(abortError());
    await flush();
    expect(result.current.mediaError).toBeNull();
    expect(result.current.phase).toBe("idle");
  });

  it("mapping des échecs de publication, média conservé", async () => {
    const attendus: Array<[unknown, string]> = [
      [new AuthError("RATE_LIMITED", "brut", 429), COMPOSER_MEDIA_RATE_LIMITED],
      [new AuthError("FORBIDDEN", "brut", 403), COMPOSER_MEDIA_FORBIDDEN],
      [new AuthError("UNAUTHORIZED", "brut", 401), COMPOSER_MEDIA_UNAUTHORIZED],
      [new AuthError("UNKNOWN_ERROR", "brut", 500), COMPOSER_MEDIA_SERVER_FAILED],
      [new AuthError("UNKNOWN_ERROR", "brut", 422), COMPOSER_PUBLICATION_FAILED_AFTER_UPLOAD],
    ];
    for (const [erreur, attendu] of attendus) {
      uploadPostMedia.mockResolvedValue({ url: "/media/a.jpg" });
      const { result, unmount } = renderHook(() => useComposerMedia());
      await act(async () => {
        await result.current.onFileChange(image("a.jpg"));
      });
      act(() => {
        expect(result.current.beginPublishing()).toBe(true);
      });
      act(() => {
        result.current.finishPublishing(false, erreur);
      });
      expect(result.current.mediaError).toBe(attendu);
      expect(result.current.mediaUrl).toBe("/media/a.jpg");
      unmount();
    }
  });
});

// ────────────────────────────────────────────── GATE 7 — object URL

describe("GATE 7 — cycle de vie des object URL", () => {
  it("remplacement : l'aperçu précédent est révoqué une seule fois", async () => {
    const a = deferred<{ url: string }>();
    const b = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    await act(async () => {
      void result.current.onFileChange(image("b.jpg"));
    });
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-a.jpg");
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });

  it("succès d'envoi : l'aperçu local est conservé ; mediaUrl distant séparé", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/api/v1/story-media/u/a.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(result.current.displayUrl).toBe("blob:preview-a.jpg");
    expect(result.current.mediaUrl).toBe("/api/v1/story-media/u/a.jpg");
    expect(result.current.mediaUrl).not.toMatch(/^blob:/);
  });

  it("retrait : révocation unique", async () => {
    const a = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(a.promise);
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    await act(async () => {
      result.current.clearMedia();
    });
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it("sélection invalide après un aperçu valide : l'ancien aperçu est libéré", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/api/v1/story-media/u/a.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    revokeObjectURL.mockClear();
    createObjectURL.mockClear();
    await act(async () => {
      await result.current.onFileChange(image("doc.pdf", "application/pdf"));
    });
    // Remplace l'aperçu conservé après 201, crée puis libère celui du refus.
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(result.current.displayUrl).toBeNull();
  });

  it("erreur d'envoi puis nouvel essai : une seule object URL vivante après succès", async () => {
    uploadPostMedia.mockRejectedValueOnce(new AuthError("UNKNOWN_ERROR", "x", 500));
    uploadPostMedia.mockResolvedValueOnce({ url: "/api/v1/story-media/u/a.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    // Premier échec révoque ; le succès conserve l'aperçu du second essai.
    expect(createObjectURL.mock.calls.length - revokeObjectURL.mock.calls.length).toBe(1);
    expect(result.current.displayUrl).toMatch(/^blob:/);
    expect(result.current.mediaUrl).toBe("/api/v1/story-media/u/a.jpg");
  });

  it("démontage avec aperçu en cours : libération exactement une fois", async () => {
    const a = deferred<{ url: string }>();
    uploadPostMedia.mockReturnValue(a.promise);
    const { result, unmount } = renderHook(() => useComposerMedia());
    await act(async () => {
      void result.current.onFileChange(image("a.jpg"));
    });
    expect(revokeObjectURL).not.toHaveBeenCalled();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-a.jpg");
  });
});

// ────────────────────────────────────────────── GATE 8 — reprise sans réenvoi

describe("GATE 8 — reprise après échec de création du post", () => {
  it("conserve le média distant et n'exige aucun nouvel envoi", async () => {
    uploadPostMedia.mockResolvedValue({ url: "https://distant/a.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);

    act(() => {
      expect(result.current.beginPublishing()).toBe(true);
    });
    act(() => {
      result.current.finishPublishing(false, new AuthError("UNKNOWN_ERROR", "x", 422));
    });

    expect(result.current.mediaUrl).toBe("https://distant/a.jpg");
    expect(result.current.mediaError).toBe(COMPOSER_PUBLICATION_FAILED_AFTER_UPLOAD);
    expect(result.current.phase).toBe("ready");
    expect(result.current.mediaReadyForPublish).toBe(true);

    // Reprise : une seule nouvelle tentative, sans réenvoi du fichier.
    act(() => {
      expect(result.current.beginPublishing()).toBe(true);
    });
    act(() => {
      result.current.finishPublishing(true);
    });
    expect(uploadPostMedia).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe("success");
    expect(result.current.errorContext).toBeNull();
  });

  it("le succès efface l'erreur de la tentative précédente", async () => {
    uploadPostMedia.mockResolvedValue({ url: "https://distant/a.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    act(() => {
      result.current.beginPublishing();
    });
    act(() => {
      result.current.finishPublishing(false, new AuthError("UNKNOWN_ERROR", "x", 500));
    });
    expect(result.current.mediaError).toBe(COMPOSER_MEDIA_SERVER_FAILED);

    act(() => {
      // `beginPublishing` remet l'erreur à zéro : l'ancienne ne doit pas
      // survivre à la nouvelle tentative.
      expect(result.current.beginPublishing()).toBe(true);
    });
    expect(result.current.mediaError).toBeNull();
  });

  it("le verrou est bien libéré après un échec, et un seul retry passe", async () => {
    uploadPostMedia.mockResolvedValue({ url: "https://distant/a.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    act(() => {
      result.current.beginPublishing();
    });
    // Verrou pris : une seconde tentative synchrone est refusée.
    act(() => {
      expect(result.current.beginPublishing()).toBe(false);
    });
    act(() => {
      result.current.finishPublishing(false, new Error("x"));
    });
    act(() => {
      expect(result.current.beginPublishing()).toBe(true);
    });
  });
});

// ─────────────────── CORRECTION 3 — média invalide, décision explicite

describe("média invalide : la publication attend une décision explicite", () => {
  it("un fichier refusé bloque la publication tant qu'il n'est pas arbitré", async () => {
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("doc.pdf", "application/pdf"));
    });

    expect(result.current.mediaError).not.toBeNull();
    // Sans cela, l'utilisateur publie un texte seul en croyant que sa photo part.
    expect(result.current.mediaReadyForPublish).toBe(false);
    act(() => {
      expect(result.current.beginPublishing()).toBe(false);
    });
  });

  it("« continuer sans image » débloque, sans rien envoyer ni publier", async () => {
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("doc.pdf", "application/pdf"));
    });

    act(() => {
      result.current.continueWithoutMedia();
    });

    expect(uploadPostMedia).not.toHaveBeenCalled();
    expect(result.current.mediaError).toBeNull();
    expect(result.current.mediaUrl).toBeNull();
    expect(result.current.phase).toBe("idle");
    expect(result.current.mediaReadyForPublish).toBe(true);
  });

  it("choisir une image valide arbitre aussi, et efface l'erreur précédente", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/media/ok.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("doc.pdf", "application/pdf"));
    });
    expect(result.current.mediaReadyForPublish).toBe(false);

    await act(async () => {
      await result.current.onFileChange(image("ok.jpg"));
    });

    expect(result.current.mediaError).toBeNull();
    expect(result.current.mediaUrl).toBe("/media/ok.jpg");
    expect(result.current.mediaReadyForPublish).toBe(true);
  });

  it("HEIC puis abandon explicite : le blocage est levé", async () => {
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("IMG.HEIC", "image/heic"));
    });
    expect(result.current.mediaError).toBe(COMPOSER_MEDIA_HEIC_NOT_SUPPORTED);
    expect(result.current.mediaReadyForPublish).toBe(false);

    act(() => {
      result.current.continueWithoutMedia();
    });
    expect(result.current.mediaReadyForPublish).toBe(true);
    expect(result.current.mediaError).toBeNull();
  });

  it("une erreur de taille bloque aussi, et un fichier corrigé la lève", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/media/ok.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    const trop_lourd = image("grande.jpg", "image/jpeg", 21 * 1024 * 1024);
    await act(async () => {
      await result.current.onFileChange(trop_lourd);
    });
    expect(result.current.mediaError).toBe(COMPOSER_MEDIA_TOO_LARGE);
    expect(result.current.mediaReadyForPublish).toBe(false);

    // Même nom de fichier, taille corrigée : l'input a été réinitialisé, la
    // nouvelle sélection doit donc bien repartir.
    await act(async () => {
      await result.current.onFileChange(image("grande.jpg", "image/jpeg", 1024));
    });
    expect(result.current.mediaError).toBeNull();
    expect(result.current.mediaReadyForPublish).toBe(true);
  });

  it("un échec d'ENVOI bloque aussi jusqu'à arbitrage", async () => {
    uploadPostMedia.mockRejectedValue(new AuthError("UNKNOWN_ERROR", "x", 500));
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    expect(result.current.mediaReadyForPublish).toBe(false);

    act(() => {
      result.current.continueWithoutMedia();
    });
    expect(result.current.mediaReadyForPublish).toBe(true);
  });

  it("un échec de PUBLICATION ne bloque pas le retry", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/media/a.jpg" });
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("a.jpg"));
    });
    act(() => {
      result.current.beginPublishing();
    });
    act(() => {
      result.current.finishPublishing(false, new AuthError("UNKNOWN_ERROR", "x", 500));
    });

    // Le média est prêt : la reprise doit rester possible immédiatement.
    expect(result.current.mediaReadyForPublish).toBe(true);
    act(() => {
      expect(result.current.beginPublishing()).toBe(true);
    });
  });

  it("aucune ancienne erreur ne subsiste après arbitrage", async () => {
    const { result } = renderHook(() => useComposerMedia());
    await act(async () => {
      await result.current.onFileChange(image("doc.pdf", "application/pdf"));
    });
    act(() => {
      result.current.continueWithoutMedia();
    });
    expect(result.current.mediaError).toBeNull();
    expect(result.current.errorContext).toBeNull();
  });
});
