// @vitest-environment jsdom

/**
 * PROFILE-POST-MENU-01 — suppression de SA publication, les deux surfaces.
 *
 * ── Ce que ces tests prouvent, et pourquoi ils sont comportementaux ──────────
 * Le défaut d'origine n'était pas une faute de logique : c'était l'ABSENCE de
 * tout chemin d'interface — un menu non rendu sur sa propre publication, et un
 * bouton « Options » `disabled` dans le code sur le profil. Une recherche
 * textuelle ne dirait rien de ce qui se passe au clic, ni du fait qu'un clic
 * sur « Supprimer » n'écrit RIEN avant confirmation. Les composants sont donc
 * réellement montés, cliqués, et leurs appels réseau sont des espions.
 *
 * Les deux surfaces couvrent les trois paliers :
 *   • la carte du fil est un arbre DOM UNIQUE pour desktop, medium et mobile
 *     (C3-FEED-RESPONSIVE-SHELL-R4 : seules des media queries les séparent) ;
 *   • `ProfileDesktopPublications` est montée par le profil propriétaire aux
 *     trois paliers (`ProfileDesktopOwnerScreen` et `ProfileCompactScreen`).
 */

import type {
  CommentListResponse,
  EventInterestToggleResponse,
  FeedPost,
} from "@yunicity/types";
import {
  PUBLICATION_DELETE_ACTION,
  PUBLICATION_DELETE_CONFIRM_BODY,
  PUBLICATION_DELETE_CONFIRM_TITLE,
  PUBLICATION_DELETE_DONE,
  PUBLICATION_DELETE_ERROR_FORBIDDEN,
  PUBLICATION_DELETE_ERROR_GENERIC,
  PUBLICATION_DELETE_PENDING,
  PROFILE_DESKTOP_PUBLICATIONS_TITLE,
  AuthError,
} from "@yunicity/utils";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FeedCardWithDependencies,
  type FeedCardDependencies,
} from "@/components/feed/feed-card";
import { FeedEditorialStreamRegion } from "@/components/feed/feed-editorial-stream-region";
import { ProfileDesktopPublications } from "@/components/profile/desktop/profile-desktop-publications";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanup);

const AUTEUR_ID = "citizen-auteur";

function publication(id = "post-1"): FeedPost {
  return {
    id,
    type: "post",
    author: {
      type: "citizen",
      id: AUTEUR_ID,
      display_name: "Kyria Mambu",
      username: "kyria",
      logo_url: null,
    },
    city: "Reims",
    title: null,
    body: "Recette multi-photos — à supprimer.",
    media_url: null,
    location: null,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
    offer: null,
    event: null,
    creator_content: null,
    neighborhood_summary: null,
    created_at: "2026-10-31T09:00:00Z",
    updated_at: "2026-10-31T09:00:00Z",
  };
}

/**
 * Promesse pilotée depuis le test — même motif que
 * `composer-publication-lock.test.tsx`.
 *
 * Un `let libere: (() => void) | null` affecté DANS le constructeur de la
 * promesse ne typecheck pas : au point d'appel, TypeScript a réduit la variable
 * à `null`, et l'appel optionnel ne laisse plus que `never`. L'assertion
 * d'affectation définie exprime ce que le constructeur garantit réellement.
 */
function differe<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function dependances(currentUserId: string | null): FeedCardDependencies {
  return {
    listComments: vi.fn(
      async (): Promise<CommentListResponse> => ({ items: [], next_cursor: null }),
    ),
    createComment: vi.fn(),
    deleteComment: vi.fn(async () => undefined),
    toggleEventInterest: vi.fn(
      async (eventId: string): Promise<EventInterestToggleResponse> => ({
        event_id: eventId,
        interested: false,
        interest_count: 0,
      }),
    ),
    currentUserId,
  };
}

function carteDuFil({
  onDeletePost,
  currentUserId = AUTEUR_ID,
}: {
  onDeletePost?: (postId: string) => Promise<void>;
  currentUserId?: string | null;
}) {
  return render(
    <FeedCardWithDependencies
      post={publication()}
      onToggleLike={vi.fn(async () => undefined)}
      onReport={vi.fn(async () => undefined)}
      onDeletePost={onDeletePost}
      dependencies={dependances(currentUserId)}
    />,
  );
}

function ouvrirMenuDuFil(): void {
  fireEvent.click(screen.getByRole("button", { name: "Plus d'actions" }));
}

describe("carte du fil — menu de sa propre publication", () => {
  it("1 — l'auteur accède à « Supprimer » quand la suppression est câblée", () => {
    // Le défaut d'origine : le menu n'était PAS RENDU sur sa propre
    // publication, donc aucun chemin de retrait n'existait dans l'interface.
    carteDuFil({ onDeletePost: vi.fn(async () => undefined) });
    ouvrirMenuDuFil();
    expect(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION })).toBeTruthy();
    // On ne se signale pas soi-même : le menu propriétaire n'offre que l'action
    // propriétaire.
    expect(screen.queryByRole("menuitem", { name: "Spam" })).toBeNull();
  });

  it("2 — sans suppression câblée, l'auteur ne voit AUCUN menu", () => {
    // Comportement préservé pour les surfaces qui ne savent pas retirer la
    // carte de leur liste (mur de Tribu, Discussions, harnais) : un kebab vide
    // serait le défaut d'origine sous une autre forme.
    carteDuFil({});
    expect(screen.queryByRole("button", { name: "Plus d'actions" })).toBeNull();
  });

  it("3 — un lecteur TIERS garde le menu de signalement intact", () => {
    carteDuFil({ onDeletePost: vi.fn(async () => undefined), currentUserId: "autre-citoyen" });
    ouvrirMenuDuFil();
    expect(screen.getByRole("menuitem", { name: "Spam" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: PUBLICATION_DELETE_ACTION })).toBeNull();
  });

  it("4 — cliquer « Supprimer » n'écrit RIEN : la confirmation s'ouvre d'abord", () => {
    const onDeletePost = vi.fn(async () => undefined);
    carteDuFil({ onDeletePost });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(PUBLICATION_DELETE_CONFIRM_TITLE)).toBeTruthy();
    expect(onDeletePost).not.toHaveBeenCalled();
  });

  it("5 — annuler ferme la confirmation sans rien supprimer", () => {
    const onDeletePost = vi.fn(async () => undefined);
    carteDuFil({ onDeletePost });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onDeletePost).not.toHaveBeenCalled();
  });

  it("6 — Échap ferme la confirmation sans rien supprimer", () => {
    const onDeletePost = vi.fn(async () => undefined);
    carteDuFil({ onDeletePost });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onDeletePost).not.toHaveBeenCalled();
  });

  it("7 — confirmer supprime la publication visée, UNE seule fois", async () => {
    const onDeletePost = vi.fn(async () => undefined);
    carteDuFil({ onDeletePost });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));

    const confirmer = screen
      .getAllByRole("button", { name: PUBLICATION_DELETE_ACTION })
      .at(-1)!;
    // Deux clics dans le même tick : le verrou doit n'envoyer qu'un `DELETE`.
    fireEvent.click(confirmer);
    fireEvent.click(confirmer);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onDeletePost).toHaveBeenCalledTimes(1);
    expect(onDeletePost).toHaveBeenCalledWith("post-1");
  });

  it("8 — un refus 403 affiche un message et GARDE la confirmation ouverte", async () => {
    const onDeletePost = vi.fn(async () => {
      throw new AuthError("FORBIDDEN", "Action non autorisée.", 403);
    });
    carteDuFil({ onDeletePost });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));
    fireEvent.click(screen.getAllByRole("button", { name: PUBLICATION_DELETE_ACTION }).at(-1)!);

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(PUBLICATION_DELETE_ERROR_FORBIDDEN),
    );
    // La carte est toujours là, et l'utilisateur peut réessayer ou annuler.
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Annuler" })).toBeTruthy();
  });

  it("9 — une panne réseau ne fait pas fuiter le message brut", async () => {
    const onDeletePost = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    carteDuFil({ onDeletePost });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));
    fireEvent.click(screen.getAllByRole("button", { name: PUBLICATION_DELETE_ACTION }).at(-1)!);

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(PUBLICATION_DELETE_ERROR_GENERIC),
    );
    expect(screen.queryByText(/Failed to fetch/)).toBeNull();
  });

  it("10 — pendant l'envoi, les deux actions sont verrouillées", async () => {
    const envoi = differe<void>();
    const onDeletePost = vi.fn(() => envoi.promise);
    carteDuFil({ onDeletePost });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));
    fireEvent.click(screen.getAllByRole("button", { name: PUBLICATION_DELETE_ACTION }).at(-1)!);

    await waitFor(() => expect(screen.getByText(PUBLICATION_DELETE_PENDING)).toBeTruthy());
    const annuler = screen.getByRole("button", { name: "Annuler" }) as HTMLButtonElement;
    expect(annuler.disabled).toBe(true);

    envoi.resolve();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("confirmation — accessibilité", () => {
  it("15 — le focus initial va sur « Annuler », l'action NON destructrice", () => {
    carteDuFil({ onDeletePost: vi.fn(async () => undefined) });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Annuler" }));
  });

  it("16 — la tabulation reste DANS la confirmation", () => {
    // `aria-modal` n'enferme pas la tabulation : sans cycle explicite, Tab
    // emmènerait derrière la modale, action destructrice toujours ouverte.
    carteDuFil({ onDeletePost: vi.fn(async () => undefined) });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));

    const annuler = screen.getByRole("button", { name: "Annuler" });
    const supprimer = screen.getAllByRole("button", { name: PUBLICATION_DELETE_ACTION }).at(-1)!;
    const dialogue = screen.getByRole("dialog");

    // Depuis « Supprimer », Tab revient sur « Annuler ».
    supprimer.focus();
    fireEvent.keyDown(dialogue, { key: "Tab" });
    expect(document.activeElement).toBe(annuler);

    // Depuis « Annuler », Maj+Tab revient sur « Supprimer ».
    annuler.focus();
    fireEvent.keyDown(dialogue, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(supprimer);
  });

  it("17 — le focus retourne au déclencheur après fermeture", () => {
    carteDuFil({ onDeletePost: vi.fn(async () => undefined) });
    const declencheur = screen.getByRole("button", { name: "Plus d'actions" });
    fireEvent.click(declencheur);
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(document.activeElement).toBe(declencheur);
  });
});

describe("après la disparition de la carte — annonce et focus", () => {
  it("18 — PROFIL : le succès est ANNONCÉ par une zone `role=\"status\"`", async () => {
    // Le défaut relevé en revue (C1) : le fil annonçait, le profil se taisait.
    const onDeletePost = vi.fn(async () => undefined);
    render(
      <ProfileDesktopPublications
        posts={[publication()]}
        displayName="Kyria Mambu"
        onDeletePost={onDeletePost}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));
    fireEvent.click(screen.getAllByRole("button", { name: PUBLICATION_DELETE_ACTION }).at(-1)!);

    const annonce = await waitFor(() => screen.getByRole("status"));
    expect(annonce.textContent).toBe(PUBLICATION_DELETE_DONE);
  });

  it("19 — PROFIL : le focus va sur le TITRE de la section, pas sur `<body>`", async () => {
    // Le déclencheur « Options » est EMPORTÉ avec la carte : le focus doit
    // atterrir sur un ancrage STABLE, et la liste de ce test est contrôlée par
    // le parent — on vérifie donc l'ancrage, qui existe dans tous les cas.
    const onDeletePost = vi.fn(async () => undefined);
    render(
      <ProfileDesktopPublications
        posts={[publication()]}
        displayName="Kyria Mambu"
        onDeletePost={onDeletePost}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));
    fireEvent.click(screen.getAllByRole("button", { name: PUBLICATION_DELETE_ACTION }).at(-1)!);

    // Le titre de la MODALE est aussi un `h2` : on cible par le nom, sinon la
    // requête est ambiguë tant que la confirmation n'est pas démontée.
    const titre = screen.getByRole("heading", {
      level: 2,
      name: PROFILE_DESKTOP_PUBLICATIONS_TITLE,
    });
    await waitFor(() => expect(document.activeElement).toBe(titre));
    expect(document.activeElement).not.toBe(document.body);
    // Focalisable PAR PROGRAMME seulement : l'ordre de tabulation est intact.
    expect(titre.getAttribute("tabindex")).toBe("-1");
  });

  it("20 — FIL : le focus va sur la RÉGION DU FLUX quand le succès est annoncé", async () => {
    // Sur le fil, l'annonce vit dans la région — au-dessus de la carte, qui a
    // disparu. C'est donc la région qui reçoit le focus : elle est stable.
    const { container, rerender } = render(
      <FeedEditorialStreamRegion
        city="Reims"
        stream={[]}
        streamLoading={false}
        streamError={null}
        highlights={[]}
        highlightOffer={null}
        savedEvents={[]}
        showSaved={false}
        onToggleLike={vi.fn(async () => undefined)}
        onReport={vi.fn(async () => undefined)}
        onRefresh={vi.fn()}
        hasNextPage={false}
        isLoadingMore={false}
        appendError={null}
        onLoadMore={vi.fn(async () => undefined)}
      />,
    );
    const region = container.querySelector(".feed-stream-region") as HTMLElement;
    expect(region).toBeTruthy();
    expect(document.activeElement).not.toBe(region);

    rerender(
      <FeedEditorialStreamRegion
        city="Reims"
        stream={[]}
        streamLoading={false}
        streamError={null}
        highlights={[]}
        highlightOffer={null}
        savedEvents={[]}
        showSaved={false}
        onToggleLike={vi.fn(async () => undefined)}
        onReport={vi.fn(async () => undefined)}
        onRefresh={vi.fn()}
        hasNextPage={false}
        isLoadingMore={false}
        appendError={null}
        onLoadMore={vi.fn(async () => undefined)}
        deleteMessage={PUBLICATION_DELETE_DONE}
      />,
    );

    await waitFor(() => expect(document.activeElement).toBe(region));
    expect(region.getAttribute("tabindex")).toBe("-1");
    expect(screen.getByRole("status").textContent).toBe(PUBLICATION_DELETE_DONE);
  });

  it("21 — l'erreur s'AJOUTE à la description de la suppression, sans la remplacer (C4)", async () => {
    const onDeletePost = vi.fn(async () => {
      throw new AuthError("FORBIDDEN", "Action non autorisée.", 403);
    });
    carteDuFil({ onDeletePost });
    ouvrirMenuDuFil();
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));

    const dialogue = screen.getByRole("dialog");
    const avant = dialogue.getAttribute("aria-describedby")!.split(" ");
    expect(avant).toHaveLength(1);

    fireEvent.click(screen.getAllByRole("button", { name: PUBLICATION_DELETE_ACTION }).at(-1)!);
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());

    const apres = dialogue.getAttribute("aria-describedby")!.split(" ");
    expect(apres).toHaveLength(2);
    // La PORTÉE reste décrite en premier, l'erreur s'ajoute ensuite.
    expect(apres[0]).toBe(avant[0]);
    expect(document.getElementById(apres[0]!)?.textContent).toBe(PUBLICATION_DELETE_CONFIRM_BODY);
    expect(document.getElementById(apres[1]!)?.textContent).toBe(
      PUBLICATION_DELETE_ERROR_FORBIDDEN,
    );
  });
});

describe("publications du profil — les trois paliers", () => {
  function profil({ onDeletePost }: { onDeletePost?: (postId: string) => Promise<void> }) {
    return render(
      <ProfileDesktopPublications
        posts={[publication()]}
        displayName="Kyria Mambu"
        onDeletePost={onDeletePost}
      />,
    );
  }

  it("11 — le profil PROPRIÉTAIRE ouvre un menu « Options » réellement actif", () => {
    // Le défaut d'origine : ce contrôle était `disabled` DANS LE CODE, au
    // mobile comme au desktop — cliquer n'avait aucun effet.
    profil({ onDeletePost: vi.fn(async () => undefined) });
    const options = screen.getByRole("button", { name: "Options" }) as HTMLButtonElement;
    expect(options.disabled).toBe(false);

    fireEvent.click(options);
    expect(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION })).toBeTruthy();
  });

  it("12 — le profil PUBLIC n'offre aucune suppression", () => {
    profil({});
    const options = screen.getByRole("button", { name: "Options" }) as HTMLButtonElement;
    expect(options.disabled).toBe(true);
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("13 — confirmation exigée, puis suppression de la publication visée", async () => {
    const onDeletePost = vi.fn(async () => undefined);
    profil({ onDeletePost });
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));

    expect(onDeletePost).not.toHaveBeenCalled();
    expect(screen.getByText(PUBLICATION_DELETE_CONFIRM_TITLE)).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: PUBLICATION_DELETE_ACTION }).at(-1)!);
    await waitFor(() => expect(onDeletePost).toHaveBeenCalledWith("post-1"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("14 — un refus 403 reste visible sur le profil aussi", async () => {
    const onDeletePost = vi.fn(async () => {
      throw new AuthError("FORBIDDEN", "Action non autorisée.", 403);
    });
    profil({ onDeletePost });
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: PUBLICATION_DELETE_ACTION }));
    fireEvent.click(screen.getAllByRole("button", { name: PUBLICATION_DELETE_ACTION }).at(-1)!);

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(PUBLICATION_DELETE_ERROR_FORBIDDEN),
    );
  });
});
