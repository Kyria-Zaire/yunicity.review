import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Zoom automatique de Safari iOS au focus d'un champ — PR202-MOBILE-P0.
 *
 * Safari agrandit la page dès qu'un champ saisissable reçoit le focus avec une
 * police sous 16 px, et ne la réduit pas au blur. Mesuré dans WebKit avant
 * correction : tous les champs visibles rendus à 14 px, à 320, 375, 390, 900 et
 * 1440 px.
 *
 * Deux propriétés sont épinglées ici, et la seconde compte autant que la
 * première : le zoom d'accessibilité doit rester possible. Supprimer le zoom
 * ferait disparaître le symptôme en retirant une fonction d'accessibilité —
 * ce serait un recul déguisé en correctif, et ce fichier l'interdit.
 */

const racine = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const GLOBALS = join(racine, "app", "globals.css");

function css(): string {
  return readFileSync(GLOBALS, "utf8");
}

/** Le bloc `@media` qui porte la règle, extrait pour être inspecté seul. */
function blocMobile(): string {
  const source = css();
  const debut = source.indexOf("@media (max-width: 767px)");
  expect(debut, "aucune règle mobile pour les champs saisissables").toBeGreaterThan(-1);
  // Jusqu'à l'accolade fermante du media, en comptant les niveaux.
  let niveau = 0;
  for (let i = source.indexOf("{", debut); i < source.length; i += 1) {
    if (source[i] === "{") niveau += 1;
    else if (source[i] === "}") {
      niveau -= 1;
      if (niveau === 0) return source.slice(debut, i + 1);
    }
  }
  throw new Error("bloc @media non refermé");
}

describe("PR202-MOBILE-P0 — les champs n'entraînent plus de zoom iOS", () => {
  it("les trois éléments saisissables passent à 16 px en mobile", () => {
    const bloc = blocMobile();

    for (const element of ["input", "textarea", "select"]) {
      expect(bloc, `${element} non couvert par la règle mobile`).toContain(element);
    }
    // 16px est le seuil exact de Safari : en dessous il zoome, au-dessus non.
    expect(bloc.replace(/\s+/g, " ")).toContain("font-size: 16px");
  });

  it("n'élargit que ce qui ouvre un clavier", () => {
    // Une case à cocher ou un bouton radio ne déclenche aucun zoom : les
    // grossir déplacerait des mises en page sans rien corriger.
    const bloc = blocMobile();
    for (const type of ["checkbox", "radio", "range", "color"]) {
      expect(bloc, `le type ${type} devrait être exclu`).toContain(`:not([type="${type}"])`);
    }
  });

  /**
   * Délai PROPRE à ce test — le délai global reste à sa valeur par défaut.
   *
   * ## Pourquoi, mesures à l'appui
   *
   * Ce test BALAIE le disque : 1252 fichiers `.ts/.tsx/.css` sous `app/` et
   * `components/`, soit 4,38 Mo lus et passés à trois expressions régulières.
   * Mesuré sur ce poste :
   *
   *   - exécuté SEUL ............... 774 ms
   *   - dans la suite complète ..... 5157 ms et 5356 ms (deux relevés)
   *
   * Le défaut de vitest est 5000 ms : la suite complète passe donc DE PEU
   * au-dessus, et l'échec est intermittent — observé une fois sur trois
   * exécutions. Ce n'est pas un défaut du code éprouvé, c'est un balayage de
   * disque mis en concurrence avec 97 autres fichiers de test.
   *
   * ⚠️ Son indépendance au diff MEDIA-MULTI-PHOTO-01 n'est PAS démontrée : le
   * balayage parcourt `components/`, où ce ticket ajoute
   * `feed-publication-carousel.tsx`. La contribution est d'un fichier sur
   * 1252 — marginale, mais NON NULLE. Le dépassement préexistait
   * vraisemblablement ; ce commentaire ne prétend pas le prouver.
   *
   * 20 s laisse quatre fois la marge du pire relevé, sans masquer une dérive
   * réelle : si ce balayage venait à dépasser 20 s, il y aurait un vrai sujet.
   */
  it(
    "le zoom manuel d'accessibilité reste autorisé dans toute l'application",
    { timeout: 20_000 },
    () => {
    const interdits = [/user-scalable\s*=\s*no/i, /user-scalable\s*:\s*no/i, /maximum-scale/i];

    const fichiers: string[] = [];
    const balayer = (dossier: string): void => {
      for (const entree of readdirSync(dossier)) {
        if (entree === "node_modules" || entree.startsWith(".next")) continue;
        const chemin = join(dossier, entree);
        if (statSync(chemin).isDirectory()) balayer(chemin);
        else if (/\.(tsx?|css)$/.test(entree)) fichiers.push(chemin);
      }
    };
    balayer(join(racine, "app"));
    balayer(join(racine, "components"));

    // Capture non vide : sans fichier balayé, l'absence serait vraie pour la
    // mauvaise raison.
    expect(fichiers.length, "aucun fichier balayé").toBeGreaterThan(0);

    const fautifs = fichiers.filter((chemin) => {
      if (chemin === GLOBALS || chemin.endsWith("ios-form-zoom.test.ts")) return false;
      const source = readFileSync(chemin, "utf8");
      return interdits.some((motif) => motif.test(source));
    });
    expect(fautifs, "le zoom utilisateur ne doit jamais être verrouillé").toEqual([]);
  });

  it("le modèle de boîte reste prévisible : preflight Tailwind actif", () => {
    // `box-sizing: border-box` vient du preflight. Sans lui, un champ en
    // largeur 100% avec padding déborderait de son conteneur — l'autre moitié
    // du défaut signalé sur iPhone.
    expect(css()).toContain("@tailwind base");
  });
});
