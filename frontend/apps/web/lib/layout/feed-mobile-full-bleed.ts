/**
 * Gouttière du fil mobile — contrat bord à bord (C3.1-R1D).
 *
 * Sous 640 px, la publication touche les bords du viewport tandis que son contenu
 * textuel reste paddé. Le média, lui, doit couvrir toute la largeur de la
 * publication : il annule donc EXACTEMENT le padding interne de la carte.
 *
 * Ces deux valeurs sont consommées par des composants distincts
 * (`FeedCardShell` pour le padding, `FeedMobileMedia` pour l'échappement).
 * Les dériver ici d'une gouttière unique empêche qu'elles divergent en silence.
 */

/** Pas d'espacement Tailwind de la gouttière mobile (4 = 1rem = 16 px). */
export const FEED_MOBILE_GUTTER_STEP = 4;

function assertGutter(gutter: number): void {
  if (!Number.isInteger(gutter) || gutter <= 0) {
    throw new Error(`Gouttière mobile invalide : ${gutter} (entier strictement positif attendu).`);
  }
}

/** Padding horizontal du contenu mobile qui n'est PAS bord à bord (compositeur, onglets, états). */
export function feedMobileContentPaddingClass(gutter: number = FEED_MOBILE_GUTTER_STEP): string {
  assertGutter(gutter);
  return `px-${gutter}`;
}

/** Padding interne d'une publication mobile — garde le texte lisible malgré le bord à bord. */
export function feedMobileCardPaddingClass(gutter: number = FEED_MOBILE_GUTTER_STEP): string {
  assertGutter(gutter);
  return `p-${gutter}`;
}

/** Échappement latéral du média — annule le padding de la carte, sans empilement arbitraire. */
export function feedMobileMediaBleedClass(gutter: number = FEED_MOBILE_GUTTER_STEP): string {
  assertGutter(gutter);
  return `-mx-${gutter}`;
}

export const FEED_MOBILE_CONTENT_PADDING_CLASS = feedMobileContentPaddingClass();
export const FEED_MOBILE_CARD_PADDING_CLASS = feedMobileCardPaddingClass();
export const FEED_MOBILE_MEDIA_BLEED_CLASS = feedMobileMediaBleedClass();
