import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * PARTNER-OFFER-CREATE-DESKTOP-LAYOUT-01 (B) — contrat CSS des enveloppes de la page
 * partenaire de création d'offre : à chaque palier, l'enveloppe inactive est masquée
 * entièrement (`display: none` : ni fond, ni hauteur, ni arbre d'accessibilité).
 * Les classes sont posées par `passport-offer-create-screen.tsx` (test jsdom voisin).
 */
const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");
const bloc = (() => {
  const debut = css.indexOf(".web-desktop-passport-offer-create-only {");
  const fin = css.indexOf("/* ——— Event create mobile");
  expect(debut, "bloc passport-offer-create introuvable").toBeGreaterThan(-1);
  expect(fin).toBeGreaterThan(debut);
  return css.slice(debut, fin);
})();

function media(requete: string): string {
  const debut = bloc.indexOf(`@media ${requete} {`);
  expect(debut, `@media ${requete} introuvable`).toBeGreaterThan(-1);
  const suite = bloc.slice(debut);
  return suite.slice(0, suite.search(/\n\}/));
}

function regle(source: string, selecteur: string): string {
  const debut = source.indexOf(`${selecteur} {`);
  expect(debut, `${selecteur} introuvable`).toBeGreaterThan(-1);
  return source.slice(debut, source.indexOf("}", debut));
}

describe("enveloppes de la création d'offre partenaire — une seule visible par palier", () => {
  it("masque l'enveloppe medium/desktop sous 640 px", () => {
    const horsMedia = bloc.slice(0, bloc.indexOf("@media"));
    expect(regle(horsMedia, ".web-medium-up-passport-offer-create-only")).toContain("display: none;");
    expect(regle(horsMedia, ".web-mobile-passport-offer-create-only")).toContain("display: block;");
  });

  it.each(["(min-width: 640px) and (max-width: 1023.98px)", "(min-width: 1024px)"])(
    "affiche l'enveloppe medium/desktop et masque l'enveloppe mobile — %s",
    (requete) => {
      const palier = media(requete);
      expect(regle(palier, ".web-medium-up-passport-offer-create-only")).toContain("display: block;");
      expect(regle(palier, ".web-mobile-passport-offer-create-only")).toContain("display: none !important;");
    },
  );
});
