// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — réordonnancement accessible des médias du brouillon.
 *
 * `moveMedia` rend la NOUVELLE position affichée (base 1) : c'est elle que
 * l'annonce `aria-live` lira, sans que l'écran ait à recalculer un index.
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNewPostDraft } from "@/hooks/use-new-post-draft";

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
  globalThis.URL.createObjectURL = vi.fn(() => "blob:apercu");
  globalThis.URL.revokeObjectURL = vi.fn();
});

function troisMedias() {
  const rendu = renderHook(() => useNewPostDraft("Reims"));
  act(() =>
    rendu.result.current.addFiles(liste(fichier("a.jpg"), fichier("b.jpg"), fichier("c.jpg"))),
  );
  return rendu;
}

describe("réordonnancement", () => {
  it("avancer échange avec le média précédent", () => {
    const { result } = troisMedias();
    const b = result.current.medias[1]!.id;
    act(() => {
      result.current.moveMedia(b, "forward");
    });
    expect(result.current.medias.map((m) => m.file.name)).toEqual(["b.jpg", "a.jpg", "c.jpg"]);
  });

  it("reculer échange avec le média suivant", () => {
    const { result } = troisMedias();
    const a = result.current.medias[0]!.id;
    act(() => {
      result.current.moveMedia(a, "backward");
    });
    expect(result.current.medias.map((m) => m.file.name)).toEqual(["b.jpg", "a.jpg", "c.jpg"]);
  });

  it("mettre en premier déplace sans perdre l'ordre des autres", () => {
    const { result } = troisMedias();
    const c = result.current.medias[2]!.id;
    act(() => {
      result.current.moveMedia(c, "first");
    });
    expect(result.current.medias.map((m) => m.file.name)).toEqual(["c.jpg", "a.jpg", "b.jpg"]);
  });

  it("avancer le premier ne fait rien et renvoie sa position", () => {
    const { result } = troisMedias();
    const a = result.current.medias[0]!.id;
    let position = 0;
    act(() => {
      position = result.current.moveMedia(a, "forward");
    });
    expect(position).toBe(1);
    expect(result.current.medias.map((m) => m.file.name)).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("renvoie la nouvelle position après un déplacement effectif", () => {
    const { result } = troisMedias();
    const c = result.current.medias[2]!.id;
    let position = 0;
    act(() => {
      position = result.current.moveMedia(c, "first");
    });
    expect(position).toBe(1);
  });

  it("l'identité des médias survit au déplacement", () => {
    const { result } = troisMedias();
    const avant = result.current.medias.map((m) => m.id).sort();
    act(() => {
      result.current.moveMedia(result.current.medias[2]!.id, "first");
    });
    expect(result.current.medias.map((m) => m.id).sort()).toEqual(avant);
  });

  it("le statut déjà acquis survit au déplacement", () => {
    const { result } = troisMedias();
    const a = result.current.medias[0]!.id;
    act(() => result.current.markUploaded(a, "https://cdn/a.jpg", "image"));
    act(() => {
      result.current.moveMedia(a, "backward");
    });
    const deplace = result.current.medias.find((m) => m.id === a);
    expect(deplace?.status).toEqual({
      kind: "uploaded",
      url: "https://cdn/a.jpg",
      mediaType: "image",
    });
  });
});
