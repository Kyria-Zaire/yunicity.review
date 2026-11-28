import type { SearchResultItem } from "@yunicity/types";

/**
 * Carte de publication des résultats de recherche web (SEARCH-RESULT-CARD-GREY-BLOCKS-01).
 *
 * Ce que la carte montre : le titre s'il existe, sinon l'extrait comme contenu principal ;
 * un libellé neutre seulement quand ni titre ni texte n'existent. Le texte reste du texte brut :
 * ces fonctions ne produisent que des chaînes, jamais de HTML.
 *
 * Volontairement distinct de `searchResultSubtitle` (partagé avec l'app Expo) : l'extrait ne
 * passe plus par le sous-titre, ce qui supprimait le doublon de la carte mobile.
 */

/** Longueur maximale de l'extrait, ellipse comprise, en caractères visibles (graphèmes). */
export const SEARCH_POST_EXCERPT_MAX_LENGTH = 280;

/** Affiché seulement quand la publication n'a ni titre ni texte : ne présume aucun média. */
export const SEARCH_POST_EMPTY_LABEL = "Publication sans texte";

const ELLIPSIS = "…";

/**
 * Sous ce seuil, couper à la dernière espace perdrait trop de texte : on coupe alors au
 * graphème (mot sans espace, lien long).
 */
const WORD_BOUNDARY_MIN_RATIO = 0.6;

export type SearchPostCardModel = {
  title: string | null;
  excerpt: string | null;
  emptyLabel: string | null;
  meta: string;
};

/** Ramène retours à la ligne et suites d'espaces (y compris insécables) à une seule espace. */
export function normalizeSearchPostText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/gu, " ").trim();
}

/**
 * Découpe en caractères visibles : un emoji composé, un drapeau ou une lettre accentuée
 * décomposée restent entiers. Repli sans `Intl.Segmenter` : points de code, qui ne coupent
 * jamais une paire de substitution.
 */
function splitGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("fr", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

/**
 * Extrait d'au plus `maxLength` caractères visibles, ellipse comprise, coupé de préférence à
 * une fin de mot. `null` si le texte est absent ou ne contient que des espaces.
 */
export function searchPostExcerpt(
  body: string | null | undefined,
  maxLength: number = SEARCH_POST_EXCERPT_MAX_LENGTH,
): string | null {
  const text = normalizeSearchPostText(body);
  if (!text) return null;
  // Chaque graphème compte au moins une unité UTF-16 : rien à couper sous ce seuil.
  if (text.length <= maxLength) return text;

  const units = splitGraphemes(text);
  if (units.length <= maxLength) return text;

  const budget = Math.max(maxLength - 1, 1);
  const head = units.slice(0, budget);
  const endsOnBoundary = units[budget] === " ";
  const lastSpace = head.lastIndexOf(" ");
  const kept =
    !endsOnBoundary && lastSpace >= Math.floor(budget * WORD_BOUNDARY_MIN_RATIO)
      ? head.slice(0, lastSpace)
      : head;
  return `${kept.join("").trimEnd()}${ELLIPSIS}`;
}

function sameText(a: string, b: string): boolean {
  return a.localeCompare(b, "fr", { sensitivity: "base" }) === 0;
}

/**
 * Retire du texte une première ligne identique au titre, et le texte entier s'il ne fait que
 * le répéter : le titre n'apparaît qu'une fois dans la carte.
 */
function bodyWithoutTitle(body: string | null | undefined, title: string | null): string | null | undefined {
  if (!body || !title) return body;
  if (sameText(normalizeSearchPostText(body), title)) return null;
  const lineBreak = body.search(/\r?\n/);
  if (lineBreak > 0 && sameText(normalizeSearchPostText(body.slice(0, lineBreak)), title)) {
    return body.slice(lineBreak);
  }
  return body;
}

export function buildSearchPostCard(
  item: Pick<SearchResultItem, "title" | "body" | "city">,
  fallbackCity: string,
): SearchPostCardModel {
  const title = normalizeSearchPostText(item.title) || null;
  const excerpt = searchPostExcerpt(bodyWithoutTitle(item.body, title));
  return {
    title,
    excerpt,
    emptyLabel: !title && !excerpt ? SEARCH_POST_EMPTY_LABEL : null,
    meta: normalizeSearchPostText(item.city) || normalizeSearchPostText(fallbackCity),
  };
}
