import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * C3-FEED-UNIFIED-PUBLICATION-CARD-R2A-TER — couture de test sans provider.
 *
 * ── Pourquoi des verrous statiques ───────────────────────────────────────────
 * Le runner de `apps/web` est en `environment: "node"` : il ne monte pas de
 * React. Ce que ces tests protègent n'est de toute façon pas un rendu, c'est
 * une RÈGLE D'ARCHITECTURE — qui a le droit d'appeler les providers. Le rendu,
 * lui, est prouvé par la spec 33 dans un vrai navigateur.
 *
 * La règle : `FeedCard` est le seul point qui touche `useYunicityApi` et
 * `useAuth` ; `FeedCardWithDependencies` n'y touche jamais. Sans ce verrou, un
 * hook réintroduit dans la vue casserait le harnais des mois plus tard, sans
 * que rien ne le signale.
 */

const lire = (chemin: string): string =>
  readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), "utf-8");

const CARTE = lire("../../components/feed/feed-card.tsx");
const HARNAIS = lire("../../e2e/harness/publication-families-mount.tsx");

/** Corps d'un export nommé, sans son sous-arbre de fonctions voisines. */
function corpsDeLExport(source: string, nom: string): string {
  const debut = source.indexOf(`export function ${nom}(`);
  expect(debut, `export ${nom} introuvable`).toBeGreaterThan(-1);
  const suivant = source.indexOf("\nexport ", debut + 1);
  return suivant === -1 ? source.slice(debut) : source.slice(debut, suivant);
}

describe("couture FeedCard / FeedCardWithDependencies", () => {
  it("1 — le conteneur appelle les DEUX hooks applicatifs", () => {
    const conteneur = corpsDeLExport(CARTE, "FeedCard");
    expect(conteneur).toMatch(/useYunicityApi\(\)/);
    expect(conteneur).toMatch(/useAuth\(\)/);
  });

  it("2 — le conteneur transmet les dépendances à la vue", () => {
    const conteneur = corpsDeLExport(CARTE, "FeedCard");
    expect(conteneur).toMatch(/<FeedCardWithDependencies[\s\S]*dependencies=\{dependencies\}/);
    // Les quatre méthodes du contrat sont toutes câblées sur l'API réelle.
    for (const methode of [
      "api.listFeedComments",
      "api.createFeedComment",
      "api.deleteFeedComment",
      "api.toggleEventInterest",
    ]) {
      expect(conteneur, `méthode non câblée : ${methode}`).toContain(methode);
    }
    expect(conteneur).toMatch(/currentUserId:\s*user\?\.id\s*\?\?\s*null/);
  });

  it("3 — la vue n'appelle NI useAuth NI useYunicityApi", () => {
    const vue = corpsDeLExport(CARTE, "FeedCardWithDependencies");
    expect(vue).not.toMatch(/useAuth\s*\(/);
    expect(vue).not.toMatch(/useYunicityApi\s*\(/);
    // Elle ne doit pas non plus atteindre l'API autrement que par le contrat.
    expect(vue).not.toMatch(/\bapi\./);
  });

  it("4 — aucune dépendance optionnelle ni repli sur un hook", () => {
    // `api ?? useYunicityApi()` et `dependencies?` sont explicitement interdits :
    // ils rendraient la frontière franchissable par inadvertance.
    expect(CARTE).not.toMatch(/dependencies\?\s*:/);
    expect(CARTE).not.toMatch(/\?\?\s*useYunicityApi\(\)/);
    expect(CARTE).not.toMatch(/\?\?\s*useAuth\(\)/);
  });

  it("5 — le contrat de dépendances est explicite et typé", () => {
    expect(CARTE).toMatch(/export type FeedCardDependencies = \{/);
    for (const membre of [
      "listComments",
      "createComment",
      "deleteComment",
      "toggleEventInterest",
      "currentUserId",
    ]) {
      expect(CARTE, `membre absent du contrat : ${membre}`).toContain(membre);
    }
    // Le plus petit contrat utile : cinq membres, pas un provider entier.
    const bloc = CARTE.slice(
      CARTE.indexOf("export type FeedCardDependencies = {"),
      CARTE.indexOf("};", CARTE.indexOf("export type FeedCardDependencies = {")),
    );
    expect(bloc.match(/^\s{2}\w+[?]?:/gm)?.length ?? 0).toBe(5);
  });

  it("6 — les consommateurs produit montent FeedCard, jamais la vue", () => {
    const portail = lire("../../components/feed/portal/feed-portal-screen.tsx");
    const listeDuFlux = lire("../../components/feed/portal/feed-stream-list.tsx");

    expect(portail).not.toMatch(/<FeedCardWithDependencies/);
    expect(portail).toMatch(/<FeedStreamList\b/);
    expect(listeDuFlux).not.toMatch(/<FeedCardWithDependencies/);
    expect(listeDuFlux).toMatch(/<FeedCard\b/);

    for (const chemin of [
      "../../components/discussions/discussions-thread-card.tsx",
      "../../components/tribes/tribe-wall-section.tsx",
    ]) {
      const source = lire(chemin);
      expect(source, `${chemin} monte la vue injectée`).not.toMatch(
        /<FeedCardWithDependencies/,
      );
      expect(source, `${chemin} ne monte plus FeedCard`).toMatch(/<FeedCard\b/);
    }
  });

  it("7 — le harnais monte la VUE, avec des dépendances typées", () => {
    expect(HARNAIS).toMatch(/<FeedCardWithDependencies/);
    expect(HARNAIS).not.toMatch(/<FeedCard\b(?!WithDependencies)/);
    expect(HARNAIS).toMatch(/const dependencies: FeedCardDependencies = \{/);
  });

  it("8 — le harnais n'intercepte rien et ne triche sur aucun type", () => {
    /*
     * On scanne le CODE, pas la prose : un commentaire qui NOMME une pratique
     * interdite pour expliquer pourquoi elle l'est ne doit pas faire échouer le
     * verrou. Premier jet de ce test : il le faisait.
     */
    const code = HARNAIS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    for (const interdit of [
      "page.route",
      "as unknown as",
      "as any",
      "globalThis.fetch",
      "window.fetch",
    ]) {
      expect(code, `harnais impur : ${interdit}`).not.toContain(interdit);
    }
  });

  it("9 — le harnais couvre les cinq familles obligatoires", () => {
    for (const famille of ["text", "image", "video", "event", "offer"]) {
      expect(HARNAIS, `famille absente : ${famille}`).toContain(`cle: "${famille}"`);
    }
  });

  it("10 — aucun branchement par largeur dans la chaîne carte", () => {
    for (const interdit of ["matchMedia", "innerWidth", 'layout === "mobile"', "isMobile"]) {
      expect(CARTE, `branchement par largeur : ${interdit}`).not.toContain(interdit);
    }
  });
});
