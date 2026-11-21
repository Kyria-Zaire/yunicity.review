// @vitest-environment jsdom

/**
 * SEARCH-EVENT-CARD-GRADIENT-01 (SRC-04) — vignette des cartes « Sortie » des résultats de recherche.
 *
 * `SearchDesktopResultCards` sert le desktop ET le medium ; `SearchMobileResultCards` le mobile.
 * Règle 14 (§0 du design system) : aucun gradient. Le fond réel (couleur calculée) est vérifié
 * au navigateur ; ce test ne fige pas les classes, il garantit seulement l'absence de dégradé.
 */

import type { SearchResultItem } from "@yunicity/types";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SearchDesktopResultCards } from "@/components/search/desktop/search-desktop-result-cards";
import { SearchMobileResultCards } from "@/components/search/mobile/search-mobile-result-cards";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const EVENTS: SearchResultItem[] = ["a", "b"].map((key) => ({
  id: `evt-${key}`,
  rank: 1,
  title: `Sortie ${key}`,
  name: null,
  slug: null,
  city: "Reims",
  body: null,
  username: null,
  starts_at: "2026-11-14T20:00:00+01:00",
  ends_at: "2026-11-14T23:00:00+01:00",
  is_flash: null,
}));

const RENDERERS = [
  ["desktop et medium", SearchDesktopResultCards],
  ["mobile", SearchMobileResultCards],
] as const;

const GRADIENT_CLASS = /(^|\s)(bg-gradient|from-|via-|to-)\S*/;

afterEach(() => cleanup());

describe.each(RENDERERS)("cartes Sortie — %s", (_label, Cards) => {
  it("renders the event thumbnails without any gradient", () => {
    const { container } = render(<Cards groupKey="events" items={EVENTS} city="Reims" />);
    const cards = [...container.querySelectorAll("li")];
    expect(cards).toHaveLength(EVENTS.length);
    expect(container.querySelectorAll("svg.lucide-calendar-days")).toHaveLength(EVENTS.length);
    for (const card of cards) {
      for (const el of [card, ...card.querySelectorAll<HTMLElement>("*")]) {
        expect(el.getAttribute("class") ?? "").not.toMatch(GRADIENT_CLASS);
        expect(el.getAttribute("style") ?? "").not.toMatch(/gradient/i);
      }
    }
  });
});
