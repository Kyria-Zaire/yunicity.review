// @vitest-environment jsdom

/**
 * FEED-NEW-UX-01 — assemblage de `/feed/new`.
 *
 * L'écran n'a plus de logique d'envoi : il assemble, et délègue à
 * `useNewPostDraft` + `useNewPostPublication`. Cette bascule met en risque les
 * acquis de `MEDIA-MULTI-PHOTO-01` pour la première fois — ils sont donc
 * prouvés ici, explicitement, par le groupe « acquis MEDIA-MULTI-PHOTO-01 ».
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { NewPostScreen } from "@/components/feed/post-composer/new-post-screen";

const uploadPostMedia = vi.fn();
const createFeedPost = vi.fn();
const getProfileMe = vi.fn();
const routerPush = vi.fn();

vi.mock("@/hooks/use-yunicity-api", () => ({
  useYunicityApi: () => ({ uploadPostMedia, createFeedPost, getProfileMe }),
}));
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ user: { id: "compte-a", email: "kyria@exemple.test" } }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/components/feed/post-composer/new-post-shell", () => ({
  NewPostShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/profile-avatar", () => ({ ProfileAvatar: () => null }));

function image(name = "photo.jpg", type = "image/jpeg", size = 3): File {
  return new File([new Uint8Array(size)], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  getProfileMe.mockResolvedValue({ display_name: "Kyria", username: "kyria", city: "Reims" });
  globalThis.URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
  globalThis.URL.revokeObjectURL = vi.fn();
});

afterEach(cleanup);

/** Monte l'écran et laisse le profil se résoudre. */
async function monter(): Promise<void> {
  render(<NewPostScreen />);
  await waitFor(() => expect(getProfileMe).toHaveBeenCalled());
}

function zoneDeTexte(): HTMLElement {
  return screen.getByLabelText(/Quoi de neuf/);
}

function champFichier(): HTMLInputElement {
  const champ = document.querySelector('input[type="file"]');
  expect(champ, "aucun champ fichier").not.toBeNull();
  return champ as HTMLInputElement;
}

async function selectionner(fichiers: File[]): Promise<void> {
  await act(async () => {
    fireEvent.change(champFichier(), { target: { files: fichiers } });
  });
}

describe("NewPostScreen", () => {
  it("publie un texte seul", async () => {
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Bonjour Reims" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(createFeedPost.mock.calls[0]![0]).toMatchObject({
      body: "Bonjour Reims",
      post_format: "text",
      visibility: "public",
    });
  });

  it("transmet la clé d'idempotence — l'écran la rend enfin RÉELLE", async () => {
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Bonjour Reims" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    const payload = createFeedPost.mock.calls[0]![0] as { client_request_id: string };
    expect(payload.client_request_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("n'affiche AUCUNE option différée", async () => {
    await monter();
    for (const absent of [
      /Identifier des personnes/i,
      /Identifier un lieu/i,
      /Ajouter une activité/i,
      /Partager dans une tribu/i,
      /Programmer/i,
      /Instagram/i,
      /TikTok/i,
      /Autoriser les commentaires/i,
      /Sondage/i,
    ]) {
      expect(screen.queryByText(absent), String(absent)).toBeNull();
    }
  });

  it("n'expose qu'un seul bouton Publier", async () => {
    await monter();
    expect(screen.getAllByRole("button", { name: "Publier" })).toHaveLength(1);
  });

  it("demande confirmation avant d'abandonner un brouillon non vide", async () => {
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Texte en cours" } });
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.getByText("Quitter sans publier ?")).toBeTruthy();
    expect(screen.getByText("Votre texte et vos médias seront perdus.")).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Quitter et perdre le brouillon" }));
    expect(routerPush).toHaveBeenCalledWith("/feed");
  });

  it("quitte sans rien demander quand le brouillon est vide", async () => {
    await monter();
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(routerPush).toHaveBeenCalledWith("/feed");
  });
});

/**
 * ⛔ Ces cinq acquis étaient tenus « par construction » tant que l'écran gardait
 * sa propre logique. La bascule sur les hooks les met en jeu : ils sont prouvés.
 */
describe("acquis MEDIA-MULTI-PHOTO-01", () => {
  it("le champ fichier accepte une sélection MULTIPLE", async () => {
    await monter();
    expect(champFichier().multiple).toBe(true);
  });

  it("affiche un aperçu de TOUS les fichiers sélectionnés, pas du premier", async () => {
    await monter();
    await selectionner([image("a.jpg"), image("b.jpg"), image("c.jpg")]);
    expect(screen.getAllByRole("presentation").map((i) => i.getAttribute("src"))).toEqual([
      "blob:a.jpg",
      "blob:b.jpg",
      "blob:c.jpg",
    ]);
  });

  it("envoie les médias en boucle et crée avec un media_urls NON VIDE", async () => {
    uploadPostMedia
      .mockResolvedValueOnce({ url: "/m/a.jpg", media_type: "image" })
      .mockResolvedValueOnce({ url: "/m/b.jpg", media_type: "image" });
    createFeedPost.mockResolvedValueOnce({ id: "post-1" });
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Deux photos" } });
    await selectionner([image("a.jpg"), image("b.jpg")]);

    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));

    expect(uploadPostMedia).toHaveBeenCalledTimes(2);
    const payload = createFeedPost.mock.calls[0]![0] as {
      media_urls: { url: string }[];
      post_format: string;
    };
    expect(payload.media_urls.map((m) => m.url)).toEqual(["/m/a.jpg", "/m/b.jpg"]);
    expect(payload.post_format).toBe("photo");
  });

  it("tient le plafond de 10 et nomme les fichiers écartés", async () => {
    await monter();
    await selectionner(Array.from({ length: 12 }, (_, i) => image(`p${i}.jpg`)));
    expect(screen.getAllByRole("presentation")).toHaveLength(10);
    expect(screen.getByText(/10 médias sur 10/)).toBeTruthy();
    expect(screen.getByText("2 fichiers n'ont pas été ajoutés")).toBeTruthy();
  });

  it("verrou anti double-publication : deux clics ⇒ une seule création", async () => {
    uploadPostMedia.mockResolvedValue({ url: "/m/a.jpg", media_type: "image" });
    createFeedPost.mockResolvedValue({ id: "post-1" });
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Bonjour Reims" } });

    const bouton = screen.getByRole("button", { name: "Publier" });
    act(() => {
      fireEvent.click(bouton);
      fireEvent.click(bouton);
    });
    await waitFor(() => expect(createFeedPost).toHaveBeenCalledTimes(1));
    expect(createFeedPost).toHaveBeenCalledTimes(1);
  });
});

describe("états d'envoi à l'écran", () => {
  it("un échec d'envoi nomme SON fichier et reste rejouable", async () => {
    uploadPostMedia
      .mockResolvedValueOnce({ url: "/m/a.jpg", media_type: "image" })
      .mockRejectedValueOnce(Object.assign(new Error("indispo"), { status: 503 }));
    await monter();
    await selectionner([image("a.jpg"), image("b.jpg")]);
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    // Désigné par le rang de SA vignette, le nom de fichier en complément.
    expect(screen.getByText("L'envoi de la photo 2 a échoué.")).toBeTruthy();
    expect(screen.getByText(/b\.jpg/)).toBeTruthy();
    // Les deux aperçus restent : rien n'est retiré du brouillon.
    expect(screen.getAllByRole("presentation")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Réessayer l'envoi" })).toBeTruthy();
  });

  it("un 409 annonce la publication déjà partie, SANS réessai", async () => {
    createFeedPost.mockRejectedValueOnce(
      Object.assign(new Error("conflit"), { status: 409, code: "POST_REQUEST_CONFLICT" }),
    );
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Bonjour Reims" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    await waitFor(() =>
      expect(screen.getByText("Cette publication a déjà été envoyée.")).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: "Réessayer l'envoi" })).toBeNull();
    expect(screen.getByRole("button", { name: "Ouvrir le fil" })).toBeTruthy();
  });

  it("une issue indéterminée n'est PAS annoncée comme un échec", async () => {
    createFeedPost.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Bonjour Reims" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    await waitFor(() =>
      expect(screen.getByText("Nous n'avons pas pu confirmer l'envoi.")).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "Réessayer l'envoi" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Abandonner" })).toBeNull();
  });

  it("annonce la progression pendant l'envoi", async () => {
    let resoudre: ((v: unknown) => void) | null = null;
    uploadPostMedia.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resoudre = r;
        }),
    );
    await monter();
    await selectionner([image("a.jpg"), image("b.jpg")]);
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    // Le rang annoncé est celui du fichier EN COURS, jamais « Envoi 0 sur 2 ».
    await waitFor(() => expect(screen.getByText("Envoi 1 sur 2")).toBeTruthy());
    await act(async () => {
      resoudre?.({ url: "/m/a.jpg", media_type: "image" });
    });
  });
});

/**
 * Revue finale FEED-NEW-UX-01 — I2, I4, et la garde de sortie à l'écran.
 */
describe("revue finale — à l'écran", () => {
  it("I2 — issue indéterminée : la flèche ouvre le dialogue qui ne promet aucune annulation", async () => {
    createFeedPost.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Bonjour Reims" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    await waitFor(() =>
      expect(screen.getByText("Nous n'avons pas pu confirmer l'envoi.")).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    const dialogue = screen.getByRole("alertdialog");
    expect(dialogue.textContent).toContain("Quitter n'annule pas cet envoi.");
    expect(dialogue.textContent).not.toMatch(/Abandonner/);
    expect(screen.getByRole("button", { name: "Quitter sans vérifier" })).toBeTruthy();
  });

  it("I4 — un échec de création n'est jamais titré du nom de l'auteur", async () => {
    createFeedPost.mockRejectedValueOnce(Object.assign(new Error("trop"), { status: 429 }));
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Bonjour Reims" } });
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));

    await waitFor(() =>
      expect(screen.getByText("La publication n'a pas pu être créée.")).toBeTruthy(),
    );
    expect(screen.queryByText(/L'envoi de/)).toBeNull();
    expect(screen.queryByText(/Kyria a échoué/)).toBeNull();
  });

  it("après un échec, « Réessayer l'envoi » est la seule action : Publier est inerte", async () => {
    uploadPostMedia.mockRejectedValueOnce(Object.assign(new Error("indispo"), { status: 503 }));
    await monter();
    await selectionner([image("a.jpg")]);
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect((screen.getByRole("button", { name: "Publier" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Réessayer l'envoi" })).toBeTruthy();
  });

  it("retirer le média en échec efface l'échec et rend Publier", async () => {
    uploadPostMedia.mockRejectedValueOnce(Object.assign(new Error("indispo"), { status: 503 }));
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Bonjour Reims" } });
    await selectionner([image("a.jpg")]);
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Retirer le média 1" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByRole("button", { name: "Publier" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("un lien du chrome est retenu tant que le brouillon est modifié", async () => {
    await monter();
    render(<a href="/map">Carte</a>);
    fireEvent.change(zoneDeTexte(), { target: { value: "Texte en cours" } });

    fireEvent.click(screen.getByText("Carte"));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Quitter et perdre le brouillon" }));
    expect(routerPush).toHaveBeenCalledWith("/map");
  });

  it("brouillon vide : le chrome navigue sans confirmation", async () => {
    await monter();
    render(<a href="/map">Carte</a>);
    const lien = screen.getByText("Carte");
    lien.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(lien);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("issue indéterminée : le texte et les vignettes sont figés, et c'est dit", async () => {
    uploadPostMedia.mockResolvedValueOnce({ url: "/m/a.jpg", media_type: "image" });
    createFeedPost.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await monter();
    fireEvent.change(zoneDeTexte(), { target: { value: "Bonjour Reims" } });
    await selectionner([image("a.jpg")]);
    fireEvent.click(screen.getByRole("button", { name: "Publier" }));
    await waitFor(() =>
      expect(screen.getByText("Nous n'avons pas pu confirmer l'envoi.")).toBeTruthy(),
    );

    expect((zoneDeTexte() as HTMLTextAreaElement).readOnly).toBe(true);
    expect(screen.getByText("Le contenu est figé tant que l'envoi n'est pas confirmé.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Retirer le média 1" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Options du média 1" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Ajouter des photos ou vidéos" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

