/**
 * Logique de rang du carrousel — arithmétique seule.
 *
 * ⛔ Ces tests ne disent RIEN du câblage du défilement : jsdom n'implémente ni
 * `scrollTo` ni l'événement `scroll`. Ce que le composant fait réellement des
 * flèches, des points et du clavier est éprouvé en navigateur par
 * `e2e/responsive/media02-carousel-interaction-accessibility.spec.ts`.
 */

import { describe, expect, it } from "vitest";

import {
  carouselIndexFromScroll,
  clampCarouselIndex,
  focusShouldFollowCurrent,
} from "@/lib/feed/publication-carousel-rank";

describe("clampCarouselIndex", () => {
  it("borne sans boucler — on ne revient pas de la dernière à la première", () => {
    expect(clampCarouselIndex(-3, 10)).toBe(0);
    expect(clampCarouselIndex(42, 10)).toBe(9);
    expect(clampCarouselIndex(4, 10)).toBe(4);
  });

  it("rend 0 sur une liste vide plutôt qu'un rang négatif", () => {
    // `total - 1` vaudrait -1 : un rang négatif ferait planter l'accès au DOM.
    expect(clampCarouselIndex(0, 0)).toBe(0);
    expect(clampCarouselIndex(5, 0)).toBe(0);
  });

  it("absorbe une valeur non finie", () => {
    expect(clampCarouselIndex(Number.NaN, 5)).toBe(0);
    expect(clampCarouselIndex(Number.POSITIVE_INFINITY, 5)).toBe(0);
  });
});

describe("carouselIndexFromScroll", () => {
  it("bascule À MI-COURSE, pas au terme du geste", () => {
    // L'arrondi — et non la troncature — fait changer le compteur quand la
    // photo suivante occupe déjà plus de la moitié du cadre. C'est ce que
    // l'œil attend ; tronquer donnerait un compteur en retard d'une photo.
    expect(carouselIndexFromScroll(0, 400, 10)).toBe(0);
    expect(carouselIndexFromScroll(199, 400, 10)).toBe(0);
    expect(carouselIndexFromScroll(201, 400, 10)).toBe(1);
    expect(carouselIndexFromScroll(400, 400, 10)).toBe(1);
  });

  it("reste borné même si le défilement déborde (rebond iOS)", () => {
    // Safari autorise un `scrollLeft` au-delà du contenu pendant le rebond.
    expect(carouselIndexFromScroll(99_999, 400, 10)).toBe(9);
    expect(carouselIndexFromScroll(-120, 400, 10)).toBe(0);
  });

  it("rend 0 tant que la piste n'a pas de largeur", () => {
    // Avant la première mise en page, `clientWidth` vaut 0 : diviser par zéro
    // rendrait `Infinity`, et le compteur sauterait au dernier rang.
    expect(carouselIndexFromScroll(250, 0, 10)).toBe(0);
  });
});

describe("focusShouldFollowCurrent", () => {
  it("ne déplace rien si le focus n'est pas dans une diapositive", () => {
    // Voler le focus à quelqu'un qui lit ailleurs dans la page serait pire que
    // le défaut corrigé.
    expect(focusShouldFollowCurrent(null, 3)).toBe(false);
  });

  it("déplace le focus quand sa diapositive cesse d'être courante", () => {
    expect(focusShouldFollowCurrent(0, 1)).toBe(true);
    expect(focusShouldFollowCurrent(4, 2)).toBe(true);
  });

  it("ne déplace rien quand le focus est déjà sur la diapositive courante", () => {
    expect(focusShouldFollowCurrent(2, 2)).toBe(false);
  });
});
