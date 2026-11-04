import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * PROFILE-POST-MENU-01 — verrous d'ARCHITECTURE du chemin de suppression.
 *
 * ── Pourquoi des verrous statiques, en plus des tests de comportement ────────
 * `lib/feed/publication-delete-flow.test.tsx` monte les deux surfaces et clique
 * réellement : il prouve le COMPORTEMENT de la carte et de la liste du profil.
 * Il ne prouve PAS la PLOMBERIE du fil, qui traverse cinq composants de
 * transmission — contrôleur → squelette → colonne → région de flux → liste →
 * carte.
 *
 * Or un prop oublié dans cette chaîne ne produit AUCUNE erreur de type :
 * `onDeletePost` est optionnel partout, et une transmission manquante rendrait
 * simplement le menu muet sur sa propre publication — exactement le défaut
 * d'origine, revenu sans que rien ne le signale.
 *
 * Les deux autres règles verrouillées ici sont des DÉCISIONS, pas des détails :
 * l'ordre « API puis retrait local », et l'absence de provider dans le hook.
 */

const lire = (chemin: string): string =>
  readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), "utf-8");

const CONTROLEUR = lire("../../components/feed/portal/feed-data-controller.tsx");
const COLONNE = lire("../../components/feed/feed-editorial-main-column.tsx");
const REGION = lire("../../components/feed/feed-editorial-stream-region.tsx");
const LISTE = lire("../../components/feed/desktop/feed-desktop-stream.tsx");
const CARTE = lire("../../components/feed/feed-card.tsx");
const EN_TETE = lire("../../components/feed/feed-author-header.tsx");
const CARTE_CITOYENNE = lire("../../components/feed/citizen-post-card.tsx");
const MENU = lire("../../components/feed/feed-post-options-menu.tsx");
const HOOK_SUPPRESSION = lire("../../hooks/use-publication-deletion.ts");
const HOOK_FIL = lire("../../hooks/use-feed.ts");
const CONTEXTE_PROFIL = lire("../../hooks/use-profile-portal-context.ts");
const PUBLICATIONS_PROFIL = lire(
  "../../components/profile/desktop/profile-desktop-publications.tsx",
);
const ECRAN_PROPRIETAIRE = lire(
  "../../components/profile/desktop/profile-desktop-owner-screen.tsx",
);
const ECRAN_COMPACT = lire("../../components/profile/profile-compact-screen.tsx");

describe("chaîne de transmission du fil", () => {
  it("1 — chaque maillon REÇOIT et RETRANSMET `onDeletePost`", () => {
    // Le contrôleur est la source : il tient le réseau et la liste.
    expect(CONTROLEUR).toMatch(/onDeletePost=\{handleDeletePost\}/);

    for (const [nom, source] of [
      ["colonne éditoriale", COLONNE],
      ["région de flux", REGION],
      ["liste du flux", LISTE],
    ] as const) {
      // Reçu en paramètre…
      expect(source, `${nom} ne reçoit pas onDeletePost`).toMatch(/^\s+onDeletePost,$/m);
      // …et retransmis au maillon suivant.
      expect(source, `${nom} ne retransmet pas onDeletePost`).toMatch(
        /onDeletePost=\{onDeletePost\}/,
      );
    }
  });

  it("2 — la carte convertit le rappel en OUVERTURE DE CONFIRMATION, pas en suppression", () => {
    // `request` n'écrit rien : c'est `confirm` qui appelle le réseau.
    expect(CARTE).toMatch(/onDelete=\{onDeletePost \? \(\) => deletion\.request\(post\) : undefined\}/);
    expect(CARTE).toMatch(/<PublicationDeleteDialog deletion=\{deletion\} \/>/);
  });

  it("3 — l'en-tête et la carte citoyenne mènent le rappel jusqu'au menu", () => {
    expect(CARTE_CITOYENNE).toMatch(/onDelete=\{onDelete\}/);
    expect(EN_TETE).toMatch(/onDelete=\{onDelete\}/);
  });

  it("4 — sans rappel câblé, l'auteur ne voit AUCUN menu", () => {
    // La garde d'origine (`viewerIsAuthor` → `null`) survit, conditionnée au
    // seul cas où rien n'est offert. La retirer rendrait un kebab vide.
    expect(MENU).toMatch(/if \(viewerIsAuthor && !onDelete\) \{\s*\n\s*return null;/);
  });

  it("5 — la famille ÉVÉNEMENT, OFFRE ou ORGANISATION ne reçoit PAS le rappel", () => {
    // Décision de périmètre : `DELETE /posts/{id}` retirerait la carte en
    // laissant l'entité source (événement, offre) en place.
    const corpsCarte = CARTE.slice(
      CARTE.indexOf("function FeedCardBody("),
      CARTE.indexOf("export type FeedCardDependencies"),
    );
    for (const famille of ["OfferFeedCard", "EventFeedCard", "OrganizationPostCard"]) {
      const appel = corpsCarte.slice(
        corpsCarte.indexOf(`<${famille}`),
        corpsCarte.indexOf("/>", corpsCarte.indexOf(`<${famille}`)),
      );
      expect(appel.length, `${famille} introuvable`).toBeGreaterThan(0);
      expect(appel, `${famille} reçoit onDelete`).not.toContain("onDelete");
    }
  });
});

describe("ordre des effets — aucune suppression optimiste", () => {
  /**
   * Retirer la carte AVANT la réponse masquerait une publication qu'un `403`
   * laisse en ligne : l'écran mentirait jusqu'au prochain rechargement. Les
   * deux propriétaires de liste doivent donc appeler l'API d'abord.
   */
  const appelAvantRetrait = (source: string, appelApi: string, retrait: string) => {
    const api = source.indexOf(appelApi);
    const filtre = source.indexOf(retrait, api);
    expect(api, `appel API introuvable : ${appelApi}`).toBeGreaterThan(-1);
    expect(filtre, `retrait local introuvable : ${retrait}`).toBeGreaterThan(api);
  };

  it("6 — le fil supprime côté serveur AVANT de retirer la carte", () => {
    appelAvantRetrait(HOOK_FIL, "await api.deleteFeedPost(postId);", "items: current.items.filter");
  });

  it("7 — le profil supprime côté serveur AVANT de retirer la carte", () => {
    appelAvantRetrait(
      CONTEXTE_PROFIL,
      "await api.deleteFeedPost(postId);",
      "setFeedPosts((current) => current.filter",
    );
  });
});

describe("couture sans provider — la vue reste montable hors contexte", () => {
  it("8 — `usePublicationDeletion` n'appelle NI `useAuth` NI `useYunicityApi`", () => {
    // Même règle que `feed-card-seam.test.ts` : un hook applicatif réintroduit
    // ici casserait le harnais E2E, qui monte la vue hors de l'arbre de
    // providers.
    expect(HOOK_SUPPRESSION).not.toMatch(/useAuth\s*\(/);
    expect(HOOK_SUPPRESSION).not.toMatch(/useYunicityApi\s*\(/);
    expect(HOOK_SUPPRESSION).not.toMatch(/\bapi\./);
    // La fonction de suppression est INJECTÉE, et non optionnelle.
    expect(HOOK_SUPPRESSION).toMatch(/deletePost: \(postId: string\) => Promise<void>;/);
  });

  it("9 — un second `confirm` dans le même tick est ignoré", () => {
    // Sans verrou, un double-clic enverrait deux `DELETE`.
    expect(HOOK_SUPPRESSION).toMatch(/if \(!target \|\| inFlightRef\.current\) return;/);
  });
});

describe("annonce et focus après disparition de la carte", () => {
  const REGION = lire("../../components/feed/feed-editorial-stream-region.tsx");
  const DIALOGUE = lire("../../components/feed/publication-delete-dialog.tsx");

  it("13 — les DEUX surfaces annoncent le succès avec le MÊME libellé", () => {
    // Un libellé dupliqué en dur dériverait au premier correctif.
    for (const [nom, source] of [
      ["profil", PUBLICATIONS_PROFIL],
      ["contrôleur du fil", CONTROLEUR],
    ] as const) {
      expect(source, `${nom} n'utilise pas la constante partagée`).toContain(
        "PUBLICATION_DELETE_DONE",
      );
    }
    expect(PUBLICATIONS_PROFIL).toMatch(/role="status"/);
    expect(REGION).toMatch(/role="status"/);
  });

  it("14 — les DEUX surfaces déplacent le focus sur un ancrage STABLE", () => {
    // La carte supprimée emporte le déclencheur : sans ancrage, le focus
    // retombe sur `<body>`. L'ancrage doit être focalisable PAR PROGRAMME
    // seulement — `tabIndex={-1}` —, sans quoi l'ordre de tabulation change.
    expect(PUBLICATIONS_PROFIL).toMatch(/ref=\{titleRef\}/);
    expect(PUBLICATIONS_PROFIL).toMatch(/titleRef\.current\?\.focus\(\)/);
    expect(PUBLICATIONS_PROFIL).toMatch(/tabIndex=\{-1\}/);

    expect(REGION).toMatch(/ref=\{regionRef\}/);
    expect(REGION).toMatch(/regionRef\.current\?\.focus\(\)/);
    expect(REGION).toMatch(/tabIndex=\{-1\}/);
  });

  it("15 — la minuterie de l'annonce du profil est NETTOYÉE au démontage", () => {
    // Le composant est monté une fois PAR PALIER : un rappel qui traîne se
    // multiplierait par trois.
    const bloc = PUBLICATIONS_PROFIL.slice(
      PUBLICATIONS_PROFIL.indexOf("if (!deletedNotice) return;"),
    ).slice(0, 400);
    expect(bloc).toMatch(/return \(\) => clearTimeout\(timer\);/);
  });

  it("16 — l'erreur de la modale S'AJOUTE à la description (C4)", () => {
    // Basculer `aria-describedby` sur le seul message d'erreur ferait cesser
    // l'annonce de la PORTÉE de la suppression.
    expect(DIALOGUE).toMatch(/aria-describedby=\{error \? `\$\{bodyId\} \$\{errorId\}` : bodyId\}/);
    expect(DIALOGUE).not.toMatch(/aria-describedby=\{error \? errorId : bodyId\}/);
  });
});

describe("frontière propriétaire / public du profil", () => {
  it("10 — les surfaces PROPRIÉTAIRES câblent la suppression", () => {
    // Desktop (onglet Publications) et compact (mobile + medium : aperçu et
    // onglet) : ce sont les trois paliers.
    expect(ECRAN_PROPRIETAIRE).toMatch(/onDeletePost=\{ctx\.deleteUserPost\}/);
    expect((ECRAN_COMPACT.match(/onDeletePost=\{ctx\.deleteUserPost\}/g) ?? []).length).toBe(2);
  });

  it("11 — le profil PUBLIC ne câble RIEN, sur aucun palier", () => {
    for (const chemin of [
      "../../components/profile/desktop/profile-desktop-public-overview.tsx",
      "../../components/profile/desktop/profile-desktop-public-screen.tsx",
      "../../components/profile/medium/profile-medium-public-overview.tsx",
      "../../components/profile/medium/profile-medium-public-screen.tsx",
      "../../components/profile/mobile/profile-mobile-public-overview.tsx",
      "../../components/profile/mobile/profile-mobile-public-screen.tsx",
    ]) {
      expect(lire(chemin), `${chemin} câble une suppression`).not.toContain("onDeletePost");
    }
  });

  it("12 — le contrôle du profil n'est actif QUE si la suppression est câblée", () => {
    // Le bouton `disabled` d'origine subsiste pour le profil public : c'est ce
    // qui garantit qu'aucune action morte n'est offerte à un visiteur.
    expect(PUBLICATIONS_PROFIL).toMatch(/\{onDeletePost \? \(/);
    expect(PUBLICATIONS_PROFIL).toMatch(/<ProfilePublicationOptionsMenu/);
    expect(PUBLICATIONS_PROFIL).toMatch(/disabled\s*\n\s*aria-label="Options"/);
  });
});
