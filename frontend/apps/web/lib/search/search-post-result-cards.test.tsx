// @vitest-environment jsdom

/**
 * SEARCH-RESULT-CARD-GREY-BLOCKS-01 — cartes de publication des résultats de recherche.
 *
 * `SearchDesktopResultCards` sert le desktop ET le medium ; `SearchMobileResultCards` le mobile.
 * JSDOM ne met rien en page : l'absence de débordement et la limite de trois lignes sont prouvées
 * dans le navigateur (fiche §10). Ici : structure, texte brut, libellés, absence d'indice cliquable.
 */

import type { SearchResultItem } from "@yunicity/types";
import { SEARCH_POST_EMPTY_LABEL } from "@yunicity/utils";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SearchDesktopResultCards } from "@/components/search/desktop/search-desktop-result-cards";
import { SearchMobileResultCards } from "@/components/search/mobile/search-mobile-result-cards";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const HTML_BODY = '<b>gras</b> <img src=x onerror="window.__xss=1"> <script>window.__xss=2</script> fin';

function post(id: string, title: string | null, body: string | null): SearchResultItem {
  return { id, rank: 1, title, body, city: "Reims", name: null, slug: null, username: null };
}

const POSTS: SearchResultItem[] = [
  post("court", null, "Marché de Noël ce soir place d'Erlon !"),
  post("multiligne", "Programme du week-end", "Samedi : brocante.\n\nDimanche : course.\n- fin"),
  post("long", null, `${"Grande collecte solidaire au centre social. ".repeat(20)}`),
  post("html", null, HTML_BODY),
  post("titre-seul", "Coucher de soleil sur la cathédrale", null),
  post("vide", null, null),
  post("espaces", "  ", "   \n  "),
  post("doublon", "Fête du quartier", "Fête du quartier"),
];

const RENDERERS = [
  ["desktop et medium", SearchDesktopResultCards],
  ["mobile", SearchMobileResultCards],
] as const;

afterEach(() => cleanup());

function cardOf(container: HTMLElement, id: string): HTMLElement {
  const index = POSTS.findIndex((p) => p.id === id);
  const card = container.querySelectorAll<HTMLElement>("[data-search-post-card]")[index];
  if (!card) throw new Error(`carte ${id} absente`);
  return card;
}

describe.each(RENDERERS)("cartes de publication — %s", (_label, Cards) => {
  const renderCards = () => render(<Cards groupKey="posts" items={POSTS} city="Reims" />).container;

  it("renders one card per post, with no decorative block, gradient or bookmark", () => {
    const container = renderCards();
    const cards = container.querySelectorAll("[data-search-post-card]");
    expect(cards).toHaveLength(POSTS.length);
    for (const card of cards) {
      expect(card.querySelector('[class*="bg-gradient"]')).toBeNull();
      expect(card.querySelector('[class*="grid-cols"]')).toBeNull();
      expect(card.querySelector('[class*="aspect-"]')).toBeNull();
      expect(card.querySelector("svg.lucide-bookmark")).toBeNull();
      expect(card.className).not.toMatch(/bg-gradient/);
    }
  });

  it("offers no clickable hint: no link, button, focusable element, hover or pointer cursor", () => {
    const container = renderCards();
    for (const card of container.querySelectorAll<HTMLElement>("[data-search-post-card]")) {
      expect(card.closest("a")).toBeNull();
      expect(card.querySelector("a, button, [tabindex], [role='link'], [role='button']")).toBeNull();
      for (const el of [card, ...card.querySelectorAll<HTMLElement>("*")]) {
        const cls = el.getAttribute("class") ?? "";
        expect(cls).not.toMatch(/(^|\s)(hover:|cursor-pointer|group-hover:)/);
      }
      expect(card.querySelector("svg.lucide-chevron-right")).toBeNull();
    }
  });

  it("never shows « Sans titre »", () => {
    expect(renderCards().textContent).not.toContain("Sans titre");
  });

  it("uses the excerpt as main content when the post has no title", () => {
    const card = cardOf(renderCards(), "court");
    const excerpt = card.querySelector("[data-search-post-excerpt]");
    expect(excerpt?.textContent).toBe("Marché de Noël ce soir place d'Erlon !");
    expect(excerpt?.className).toContain("text-neutral-900");
    expect(card.querySelector("h3")).toBeNull();
  });

  it("clamps the excerpt to three lines and lets long words wrap inside the card", () => {
    const excerpt = cardOf(renderCards(), "long").querySelector("[data-search-post-excerpt]");
    expect(excerpt?.className).toContain("line-clamp-3");
    expect(excerpt?.className).toContain("[overflow-wrap:anywhere]");
    expect(excerpt?.textContent?.endsWith("…")).toBe(true);
  });

  it("normalises line breaks into spaces, under the title and city", () => {
    const card = cardOf(renderCards(), "multiligne");
    expect(card.querySelector("[data-search-post-excerpt]")?.textContent).toBe(
      "Samedi : brocante. Dimanche : course. - fin",
    );
    expect(card.textContent).toContain("Programme du week-end");
    expect(card.textContent).toContain("Reims");
  });

  it("renders HTML-looking text literally, creating no element", () => {
    const card = cardOf(renderCards(), "html");
    expect(card.querySelector("b, img, script")).toBeNull();
    expect(card.querySelector("[data-search-post-excerpt]")?.textContent).toBe(HTML_BODY);
  });

  it("shows the neutral label only when title and text are both absent or blank", () => {
    const container = renderCards();
    expect(cardOf(container, "vide").textContent).toContain(SEARCH_POST_EMPTY_LABEL);
    expect(cardOf(container, "espaces").textContent).toContain(SEARCH_POST_EMPTY_LABEL);
    expect(cardOf(container, "titre-seul").textContent).not.toContain(SEARCH_POST_EMPTY_LABEL);
    expect(cardOf(container, "titre-seul").querySelector("[data-search-post-excerpt]")).toBeNull();
    expect(container.textContent?.split(SEARCH_POST_EMPTY_LABEL)).toHaveLength(3);
  });

  it("shows the post text once per card, and never repeats the title", () => {
    const container = renderCards();
    const court = cardOf(container, "court").textContent ?? "";
    expect(court.split("Marché de Noël").length - 1).toBe(1);
    const doublon = cardOf(container, "doublon").textContent ?? "";
    expect(doublon.split("Fête du quartier").length - 1).toBe(1);
  });
});
