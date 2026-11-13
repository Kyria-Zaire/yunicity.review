// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — grille de médias ordonnée et accessible.
 *
 * Le réordonnancement doit rester atteignable **au clavier seul**, via le menu
 * `•••`. Le glisser-déposer n'est qu'un raccourci : il ne portera jamais
 * l'accessibilité à lui seul.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewPostMediaGrid } from "@/components/feed/post-composer/new-post-media-grid";
import type { MediaDraft } from "@/hooks/use-new-post-draft";

afterEach(cleanup);

function media(id: string, name: string): MediaDraft {
  return {
    id,
    file: new File(["x"], name, { type: "image/jpeg" }),
    previewUrl: `blob:${id}`,
    mediaType: "image",
    status: { kind: "selected" },
  };
}

const trois = [media("a", "1.jpg"), media("b", "2.jpg"), media("c", "3.jpg")];

describe("NewPostMediaGrid", () => {
  it("calcule le compteur à partir des médias", () => {
    render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText(/3 médias sur 10/)).toBeTruthy();
  });

  it("affiche un aperçu de CHAQUE fichier, pas seulement du premier", () => {
    // Acquis MEDIA-MULTI-PHOTO-01 : la mosaïque montrait une seule vignette.
    render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const apercus = screen.getAllByRole("presentation");
    expect(apercus.map((image) => image.getAttribute("src"))).toEqual([
      "blob:a",
      "blob:b",
      "blob:c",
    ]);
  });

  it("annonce la position de chaque média", () => {
    render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Média 2 sur 3")).toBeTruthy();
  });

  it("offre un réordonnancement atteignable au clavier", () => {
    const onMove = vi.fn().mockReturnValue(1);
    render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={onMove}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Options du média/ })[1]!);
    fireEvent.click(screen.getByRole("button", { name: "Avancer" }));
    expect(onMove).toHaveBeenCalledWith("b", "forward");
  });

  it("annonce le déplacement en aria-live", () => {
    const onMove = vi.fn().mockReturnValue(1);
    render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={onMove}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Options du média/ })[1]!);
    fireEvent.click(screen.getByRole("button", { name: "Avancer" }));
    expect(screen.getByRole("status").textContent).toBe("Média déplacé en position 1");
  });

  it("retire le média demandé et referme le menu", () => {
    const onRemove = vi.fn();
    render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={vi.fn()}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Options du média/ })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));
    expect(onRemove).toHaveBeenCalledWith("a");
    expect(screen.queryByRole("button", { name: "Retirer" })).toBeNull();
  });

  it("n'offre pas d'avancer le premier ni de reculer le dernier", () => {
    render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Options du média/ })[0]!);
    expect(screen.getByRole("button", { name: "Avancer" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Reculer" })).toHaveProperty("disabled", false);
  });

  it("cache le bouton d'ajout quand le plafond est atteint", () => {
    const dix = Array.from({ length: 10 }, (_, i) => media(`m${i}`, `${i}.jpg`));
    render(
      <NewPostMediaGrid
        medias={dix}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Ajouter des photos ou vidéos" })).toBeNull();
  });

  it("propose l'ajout tant que le plafond n'est pas atteint", () => {
    const onAdd = vi.fn();
    render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={onAdd}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ajouter des photos ou vidéos" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("signale le média en échec sans le retirer du brouillon", () => {
    const enEchec: MediaDraft[] = [
      { ...media("a", "1.jpg"), status: { kind: "failed", reason: "Connexion interrompue." } },
      media("b", "2.jpg"),
    ];
    render(
      <NewPostMediaGrid
        medias={enEchec}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("presentation")).toHaveLength(2);
    expect(screen.getByText("Échec")).toBeTruthy();
  });
});

describe("NewPostMediaGrid — planches et revue finale", () => {
  function grille(props: Partial<Parameters<typeof NewPostMediaGrid>[0]> = {}) {
    return render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={vi.fn().mockReturnValue(1)}
        onRemove={vi.fn()}
        {...props}
      />,
    );
  }

  it("vide : une zone d'ajout qui annonce le plafond", () => {
    const onAdd = vi.fn();
    grille({ medias: [], onAdd });
    const zone = screen.getByRole("button", { name: /Ajouter des photos ou vidéos/ });
    expect(zone.textContent).toContain("Jusqu'à 10 médias");
    fireEvent.click(zone);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("la pastille ✕ retire LE média visé, nommé par son rang", () => {
    const onRemove = vi.fn();
    grille({ onRemove });
    fireEvent.click(screen.getByRole("button", { name: "Retirer le média 2" }));
    expect(onRemove).toHaveBeenCalledWith("b");
  });

  it("I7 — le menu n'est pas enfermé dans un cadre qui le rogne", () => {
    grille();
    fireEvent.click(screen.getByRole("button", { name: "Options du média 3" }));
    const retirer = screen.getByRole("button", { name: "Retirer" });
    // Aucun ancêtre du menu ne coupe son débordement.
    let parent = retirer.parentElement;
    while (parent && parent !== document.body) {
      expect(parent.className).not.toMatch(/overflow-hidden/);
      parent = parent.parentElement;
    }
  });

  it("Échap referme le menu d'une vignette", () => {
    grille();
    fireEvent.click(screen.getByRole("button", { name: "Options du média 1" }));
    expect(screen.getByRole("button", { name: "Retirer" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Retirer" })).toBeNull();
  });

  it("après une tentative, chaque vignette dit où elle en est", () => {
    const lot: MediaDraft[] = [
      { ...media("a", "1.jpg"), status: { kind: "uploaded", url: "u", mediaType: "image" } },
      { ...media("b", "2.jpg"), status: { kind: "failed", reason: "x" } },
      media("c", "3.jpg"),
    ];
    grille({ medias: lot, showStatus: true });
    expect(screen.getByText("Envoyée")).toBeTruthy();
    expect(screen.getByText("Échec")).toBeTruthy();
    expect(screen.getByText("En attente")).toBeTruthy();
  });

  it("pendant un envoi, l'ajout est inerte : le lot est figé", () => {
    grille({ addDisabled: true });
    const bouton = screen.getByRole("button", { name: "Ajouter des photos ou vidéos" });
    expect((bouton as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("NewPostMediaGrid — format des aperçus (recette du 04/11)", () => {
  it("vignettes et tuile d'ajout partagent le format 5:4 de la maquette", () => {
    const { container } = render(
      <NewPostMediaGrid
        medias={trois}
        maxCount={10}
        addDisabled={false}
        editDisabled={false}
        showStatus={false}
        onAdd={vi.fn()}
        onMove={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    // 3 vignettes + 1 tuile d'ajout, aucune carrée.
    expect(container.querySelectorAll('[class~="aspect-[5/4]"]')).toHaveLength(4);
    expect(container.querySelectorAll('[class~="aspect-square"]')).toHaveLength(0);
    // L'image recadre à l'affichage : le fichier n'est pas modifié.
    for (const image of container.querySelectorAll("img")) {
      expect(image.className).toContain("object-cover");
    }
  });
});
