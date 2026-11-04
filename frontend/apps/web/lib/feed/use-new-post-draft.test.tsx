// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — brouillon de `/feed/new` : chaque média porte son identité
 * et son statut, chaque fichier refusé est nommé, et le format se déduit du
 * contenu au lieu d'être choisi par un onglet.
 */

import { act, renderHook } from "@testing-library/react";
import { POST_COMPOSER_BODY_MAX } from "@yunicity/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNewPostDraft } from "@/hooks/use-new-post-draft";

function fichier(name: string, type: string, size = 1024): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
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
  globalThis.URL.createObjectURL = vi.fn(() => "blob:apercu");
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe("format déduit du contenu", () => {
  it("texte seul donne le format texte", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => result.current.setBody("Bonjour Reims"));
    expect(result.current.postFormat).toBe("text");
  });

  it("une image donne le format photo", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => result.current.addFiles(liste(fichier("a.jpg", "image/jpeg"))));
    expect(result.current.postFormat).toBe("photo");
  });

  it("une vidéo dans le lot donne le format vidéo", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() =>
      result.current.addFiles(
        liste(fichier("a.jpg", "image/jpeg"), fichier("b.mp4", "video/mp4")),
      ),
    );
    expect(result.current.postFormat).toBe("video");
  });

  it("n'écarte JAMAIS un fichier au motif qu'il mélange photo et vidéo", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() =>
      result.current.addFiles(
        liste(fichier("a.jpg", "image/jpeg"), fichier("b.mp4", "video/mp4")),
      ),
    );
    expect(result.current.medias).toHaveLength(2);
    expect(result.current.rejectedFiles).toHaveLength(0);
  });
});

describe("rejets nommés", () => {
  it("nomme CHAQUE fichier refusé, sans écraser les précédents", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    const trenteMo = 30 * 1024 * 1024;
    act(() =>
      result.current.addFiles(
        liste(
          fichier("un.jpg", "image/jpeg", trenteMo),
          fichier("deux.jpg", "image/jpeg", trenteMo),
          fichier("trois.heic", "image/heic"),
        ),
      ),
    );
    expect(result.current.rejectedFiles.map((r) => r.name)).toEqual([
      "un.jpg",
      "deux.jpg",
      "trois.heic",
    ]);
  });

  it("ne retire aucun média valide quand un autre est refusé", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => result.current.addFiles(liste(fichier("ok.jpg", "image/jpeg"))));
    act(() =>
      result.current.addFiles(liste(fichier("lourd.jpg", "image/jpeg", 30 * 1024 * 1024))),
    );
    expect(result.current.medias).toHaveLength(1);
    expect(result.current.rejectedFiles).toHaveLength(1);
  });

  it("vider les rejets ne touche pas aux médias", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() =>
      result.current.addFiles(
        liste(fichier("ok.jpg", "image/jpeg"), fichier("x.heic", "image/heic")),
      ),
    );
    act(() => result.current.dismissRejectedFiles());
    expect(result.current.rejectedFiles).toHaveLength(0);
    expect(result.current.medias).toHaveLength(1);
  });

  it("deux sélections de 6 : garde 10 médias et NOMME les 2 écartés", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    const lot = (prefixe: string) =>
      liste(
        ...Array.from({ length: 6 }, (_, i) => fichier(`${prefixe}-${i}.jpg`, "image/jpeg")),
      );
    act(() => result.current.addFiles(lot("a")));
    act(() => result.current.addFiles(lot("b")));
    expect(result.current.medias).toHaveLength(10);
    expect(result.current.rejectedFiles.map((r) => r.name)).toEqual(["b-4.jpg", "b-5.jpg"]);
  });
});

describe("payload et publication", () => {
  it("n'envoie que les options qui ont un effet", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => result.current.setBody("Bonjour"));
    const payload = result.current.buildCreatePayload([]);
    expect(payload).toMatchObject({
      body: "Bonjour",
      visibility: "public",
      post_format: "text",
      allow_comments: true,
    });
    // Les options différées ne sont plus envoyées du tout.
    expect(payload).not.toHaveProperty("cross_post_targets");
    expect(payload).not.toHaveProperty("linked_tribe_id");
    expect(payload).not.toHaveProperty("scheduled_at");
  });

  it("porte les URL reçues en argument, jamais relues depuis l'état", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => result.current.addFiles(liste(fichier("a.jpg", "image/jpeg"))));
    // Le média est encore `selected` : seul l'argument peut remplir media_urls.
    const payload = result.current.buildCreatePayload([
      { url: "https://cdn/a.jpg", media_type: "image" },
    ]);
    expect(payload.media_urls).toEqual([{ url: "https://cdn/a.jpg", media_type: "image" }]);
    expect(payload.media_url).toBe("https://cdn/a.jpg");
    expect(payload.post_format).toBe("photo");
  });

  it("un texte réduit à des espaces ne publie pas", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => result.current.setBody("   \n  "));
    expect(result.current.canPublish).toBe(false);
  });

  it("un texte au-delà de la limite ne publie pas", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => result.current.setBody("a".repeat(POST_COMPOSER_BODY_MAX + 1)));
    expect(result.current.canPublish).toBe(false);
  });
});

describe("transitions d'état d'un média", () => {
  it("marque un média envoyé sans toucher aux autres", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() =>
      result.current.addFiles(
        liste(fichier("1.jpg", "image/jpeg"), fichier("2.jpg", "image/jpeg")),
      ),
    );
    const premier = result.current.medias[0]!.id;
    act(() => result.current.markUploaded(premier, "https://cdn/1.jpg", "image"));
    expect(result.current.medias[0]!.status).toEqual({
      kind: "uploaded",
      url: "https://cdn/1.jpg",
      mediaType: "image",
    });
    expect(result.current.medias[1]!.status.kind).toBe("selected");
  });

  it("un échec porte son motif et reste rejouable", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => result.current.addFiles(liste(fichier("1.jpg", "image/jpeg"))));
    const id = result.current.medias[0]!.id;
    act(() => result.current.markFailed(id, "Connexion interrompue."));
    expect(result.current.medias[0]!.status).toEqual({
      kind: "failed",
      reason: "Connexion interrompue.",
    });
  });

  it("marquer un identifiant inconnu ne casse rien", () => {
    const { result } = renderHook(() => useNewPostDraft("Reims"));
    act(() => result.current.addFiles(liste(fichier("1.jpg", "image/jpeg"))));
    act(() => result.current.markUploaded("inconnu", "https://cdn/x.jpg", "image"));
    expect(result.current.medias).toHaveLength(1);
    expect(result.current.medias[0]!.status.kind).toBe("selected");
  });
});
