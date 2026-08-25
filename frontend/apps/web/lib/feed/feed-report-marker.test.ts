import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * C3-FEED-R2A-SPEC30-OVERFLOW-MIGRATION — le marqueur `Signaler` autonome est mort.
 *
 * ── Ce que ce verrou protège ─────────────────────────────────────────────────
 * R2A a supprimé `ReportAction` : le signalement passe désormais uniquement par
 * le menu « Plus d'actions » de l'en-tête. Mais `data-feed-publication-report`
 * a survécu trois fois — une règle CSS morte, une mesure devenue `undefined`,
 * et surtout une assertion qui, avec son `?? 0`, ne pouvait PLUS JAMAIS échouer.
 *
 * Un test vrai par construction est pire qu'un test absent : il occupe la place
 * du contrat qu'il prétend défendre. Ce fichier interdit la réapparition du
 * marqueur côté produit, et inventorie nommément les seuls usages tolérés —
 * des assertions NÉGATIVES, qui prouvent son absence.
 */

const MARQUEUR = "data-feed-publication-report";

/** Racine `apps/web`, quelle que soit la profondeur d'appel. */
const RACINE = fileURLToPath(new URL("../..", import.meta.url));

/** Occurrences NÉGATIVES tolérées, inventoriées une par une. */
const ASSERTIONS_NEGATIVES_AUTORISEES = [
  "e2e/functional/30-medium-feed-publication-cards.spec.ts",
  "e2e/functional/33-unified-publication-card.spec.ts",
];

const EXTENSIONS = [".ts", ".tsx", ".css", ".mjs"];
const IGNORES = new Set(["node_modules", ".next", ".next-build", "test-results", "playwright-report"]);

function fichiers(dossier: string, acc: string[] = []): string[] {
  for (const entree of readdirSync(dossier)) {
    if (IGNORES.has(entree)) continue;
    const chemin = `${dossier}/${entree}`;
    if (statSync(chemin).isDirectory()) {
      fichiers(chemin, acc);
    } else if (EXTENSIONS.some((e) => entree.endsWith(e))) {
      acc.push(chemin);
    }
  }
  return acc;
}

/** Retire commentaires de bloc et de ligne : on juge le CODE, pas la prose. */
function sansCommentaires(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("marqueur Signaler autonome", () => {
  const trouves = fichiers(RACINE)
    .map((chemin) => ({
      chemin: chemin.slice(RACINE.length).replace(/\\/g, "/").replace(/^\/+/, ""),
      code: sansCommentaires(readFileSync(chemin, "utf-8")),
    }))
    // Ce fichier NOMME le marqueur pour le traquer : il ne peut pas se juger
    // lui-même, sans quoi le verrou échouerait sur sa propre définition.
    .filter(
      ({ chemin, code }) =>
        chemin !== "lib/feed/feed-report-marker.test.ts" && code.includes(MARQUEUR),
    );

  it("n'apparaît nulle part dans le produit", () => {
    const produit = trouves.filter(
      ({ chemin }) => !chemin.startsWith("e2e/") && !chemin.endsWith(".test.ts"),
    );
    expect(
      produit.map((f) => f.chemin),
      "le marqueur Signaler autonome est réapparu côté produit",
    ).toEqual([]);
  });

  it("ne subsiste que dans les assertions négatives inventoriées", () => {
    expect(trouves.map((f) => f.chemin).sort()).toEqual(
      [...ASSERTIONS_NEGATIVES_AUTORISEES].sort(),
    );
  });

  it("chaque occurrence tolérée prouve bien une ABSENCE", () => {
    for (const { chemin, code } of trouves) {
      const lignes = code.split("\n").filter((l) => l.includes(MARQUEUR));
      for (const ligne of lignes) {
        // `toHaveCount(0)` ou une collecte `.length` assertée à zéro ensuite.
        const negative = /toHaveCount\(0\)|\.length/.test(ligne);
        expect(negative, `${chemin} : usage POSITIF du marqueur — « ${ligne.trim()} »`).toBe(true);
      }
    }
  });

  /*
   * SECONDE SURFACE (C3-FEED-R2A-SPEC21-OVERFLOW-MIGRATION).
   *
   * Le verrou ci-dessus ne traquait que l'ATTRIBUT. Or la migration R2A en a
   * deux : l'attribut supprime, et le NOM ACCESSIBLE passe de « Signaler » a
   * « Plus d'actions ». La spec 21 cherchait encore un bouton nomme
   * « Signaler » — l'assertion « propre publication » passait donc a zero pour
   * la mauvaise raison. On interdit desormais aussi les selecteurs par nom.
   */
  it("aucune spec ne cible un contrôle NOMMÉ « Signaler »", () => {
    const specs = fichiers(`${RACINE}/e2e`).filter((c) => c.endsWith(".spec.ts"));
    const fautifs: string[] = [];
    for (const chemin of specs) {
      const code = sansCommentaires(readFileSync(chemin, "utf-8"));
      // Selecteurs POSITIFS par nom : getByRole/getByLabel/getByText « signaler ».
      if (/get(ByRole|ByLabel|ByLabelText|ByText)\([^)]*signaler/i.test(code)) {
        fautifs.push(chemin.slice(RACINE.length).replace(/\\/g, "/").replace(/^\/+/, ""));
      }
    }
    expect(
      fautifs,
      "le déclencheur s'appelle « Plus d'actions » ; « Signaler » n'est plus qu'un titre DANS le menu",
    ).toEqual([]);
  });

  it("la spec 21 cible bien le déclencheur du menu", () => {
    const code = readFileSync(`${RACINE}/e2e/functional/21-mobile-feed-functional.spec.ts`, "utf-8");
    expect(code).toContain("data-feed-publication-overflow");
    expect(code).toContain("Plus d'actions");
  });

  it("aucun repli qui rendrait une assertion vraie par construction", () => {
    for (const { chemin, code } of trouves) {
      for (const ligne of code.split("\n").filter((l) => l.includes(MARQUEUR))) {
        expect(
          /\?\?\s*0/.test(ligne),
          `${chemin} : sentinelle « ?? 0 » sur le marqueur — « ${ligne.trim()} »`,
        ).toBe(false);
      }
    }
  });
});
