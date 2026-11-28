// @vitest-environment jsdom

/**
 * SEARCH-EVENT-PAST-STATUS-01 — badge « Terminé » sur les cartes d'événement des résultats.
 *
 * `SearchDesktopResultCards` sert le desktop ET le medium ; `SearchMobileResultCards` le mobile.
 * Le badge n'apparaît que si la règle de fin le confirme (D3) ; ordre, liens et sous-titre
 * restent ceux d'avant. La mise en page réelle (débordement, contraste) est mesurée au navigateur.
 */

import type { SearchGroupKey, SearchResultItem } from "@yunicity/types";
import { searchResultSubtitle } from "@yunicity/utils";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchDesktopResultCards } from "@/components/search/desktop/search-desktop-result-cards";
import { SearchMobileResultCards } from "@/components/search/mobile/search-mobile-result-cards";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NOW = new Date("2026-11-13T12:00:00+01:00");

type Case = { key: string; starts_at: string | null; ends_at?: string | null; ended: boolean };

const CASES: Case[] = [
  { key: "a-venir", starts_at: "2026-11-14T20:00:00+01:00", ends_at: "2026-11-14T23:00:00+01:00", ended: false },
  { key: "en-cours", starts_at: "2026-11-13T10:00:00+01:00", ends_at: "2026-11-13T18:00:00+01:00", ended: false },
  { key: "termine", starts_at: "2026-11-12T20:00:00+01:00", ends_at: "2026-11-12T23:00:00+01:00", ended: true },
  { key: "plusieurs-jours-en-cours", starts_at: "2026-11-11T10:00:00+01:00", ends_at: "2026-11-14T18:00:00+01:00", ended: false },
  { key: "plusieurs-jours-termine", starts_at: "2026-11-08T10:00:00+01:00", ends_at: "2026-11-11T18:00:00+01:00", ended: true },
  { key: "fin-null-avant-repli", starts_at: "2026-11-13T11:00:00+01:00", ends_at: null, ended: false },
  { key: "fin-null-apres-repli", starts_at: "2026-11-11T20:00:00+01:00", ends_at: null, ended: true },
  { key: "cle-absente", starts_at: "2026-11-01T20:00:00+01:00", ended: false },
  { key: "fin-illisible", starts_at: "2026-11-01T20:00:00+01:00", ends_at: "pas-une-date", ended: false },
  { key: "fin-anterieure", starts_at: "2026-11-01T20:00:00+01:00", ends_at: "2026-10-31T20:00:00+01:00", ended: false },
];

function eventItem(c: Case): SearchResultItem {
  const item: SearchResultItem = {
    id: `evt-${c.key}`,
    rank: 1,
    title: `Sortie ${c.key}`,
    name: null,
    slug: null,
    city: "Reims",
    body: null,
    username: null,
    starts_at: c.starts_at,
    is_flash: null,
  };
  // « cle-absente » imite une réponse antérieure : la clé n'existe pas du tout.
  if ("ends_at" in c) item.ends_at = c.ends_at;
  return item;
}

const ITEMS = CASES.map(eventItem);

const RENDERERS = [
  ["desktop et medium", SearchDesktopResultCards],
  ["mobile", SearchMobileResultCards],
] as const;

function renderCards(
  Cards: (typeof RENDERERS)[number][1],
  items: SearchResultItem[],
  groupKey: SearchGroupKey = "events",
) {
  return render(<Cards groupKey={groupKey} items={items} city="Reims" />);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe.each(RENDERERS)("cartes d'événement — %s", (_label, Cards) => {
  it("affiche « Terminé » uniquement quand la règle de fin le confirme", () => {
    const { container } = renderCards(Cards, ITEMS);
    const cards = [...container.querySelectorAll("li")];
    expect(cards).toHaveLength(CASES.length);
    cards.forEach((card, index) => {
      const c = CASES[index]!;
      const badges = card.querySelectorAll("[data-search-event-ended]");
      expect(badges.length, c.key).toBe(c.ended ? 1 : 0);
      // Titres fictifs sans accent : « Terminé » ne peut venir que du badge.
      expect((card.textContent ?? "").includes("Terminé"), c.key).toBe(c.ended);
      if (c.ended) expect(badges[0]!.textContent).toBe("Terminé");
    });
  });

  it("garde l'ordre reçu, les liens et le sous-titre inchangés", () => {
    const { container } = renderCards(Cards, ITEMS);
    const cards = [...container.querySelectorAll("li")];
    expect(cards.map((card) => card.querySelector("a")?.getAttribute("href"))).toEqual(
      ITEMS.map((item) => `/events/${item.id}`),
    );
    cards.forEach((card, index) => {
      const item = ITEMS[index]!;
      expect(card.textContent).toContain(item.title);
      const subtitle = searchResultSubtitle(item, "events", "Reims");
      expect(subtitle.length).toBeGreaterThan(0);
      expect((card.textContent ?? "").split(subtitle).length - 1, CASES[index]!.key).toBe(1);
    });
  });

  it("réponse ancienne sans aucune clé ends_at : aucun badge", () => {
    const legacy = ITEMS.map((item) => {
      const copy = { ...item };
      delete copy.ends_at;
      return copy;
    });
    expect(legacy.every((item) => !("ends_at" in item))).toBe(true);
    const { container } = renderCards(Cards, legacy);
    expect(container.querySelectorAll("li")).toHaveLength(legacy.length);
    expect(container.querySelectorAll("[data-search-event-ended]")).toHaveLength(0);
    expect(container.textContent).not.toContain("Terminé");
  });

  it("le statut est calculé au rendu : un nouveau rendu après la fin fait apparaître le badge", () => {
    const fields = CASES.find((c) => c.key === "en-cours")!;
    const item = eventItem(fields);
    const first = renderCards(Cards, [item]);
    expect(first.container.querySelector("[data-search-event-ended]")).toBeNull();
    first.unmount();
    vi.setSystemTime(new Date("2026-11-13T18:00:00+01:00"));
    const second = renderCards(Cards, [item]);
    expect(second.container.querySelector("[data-search-event-ended]")).not.toBeNull();
  });

  it("aucun badge hors du groupe des événements, même avec des dates passées", () => {
    const tribe = { ...eventItem(CASES.find((c) => c.key === "termine")!), id: "tribe-1" };
    const { container } = renderCards(Cards, [tribe], "tribes");
    expect(container.querySelector("[data-search-event-ended]")).toBeNull();
  });
});

describe("placement du badge", () => {
  const endedItem = eventItem(CASES.find((c) => c.key === "termine")!);

  it("desktop et medium : sur la ligne du sur-titre « Sortie »", () => {
    const { container } = renderCards(SearchDesktopResultCards, [endedItem]);
    const badge = container.querySelector("[data-search-event-ended]")!;
    const line = badge.parentElement!;
    expect(line.textContent).toBe("SortieTerminé");
    expect(line.nextElementSibling?.tagName).toBe("H3");
  });

  it("mobile : en tête de la ligne de sous-titre", () => {
    const { container } = renderCards(SearchMobileResultCards, [endedItem]);
    const badge = container.querySelector("[data-search-event-ended]")!;
    const line = badge.parentElement!;
    expect(line.firstElementChild).toBe(badge);
    expect(line.textContent).toBe(`Terminé${searchResultSubtitle(endedItem, "events", "Reims")}`);
  });
});
