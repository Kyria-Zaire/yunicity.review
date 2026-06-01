import { describe, expect, it } from "vitest";

import type { LocalEvent, Neighborhood, Tribe } from "@yunicity/types";

import {
  buildLocalHintsFromTerritory,
  buildNotificationEmptyState,
  formatActivityMetric,
  notificationsHumanizeHasNoFakeMetrics,
  resolveEmptyStateSuggestions,
} from "./notifications-humanize";

describe("notifications-humanize", () => {
  it("adoucit les métriques à zéro", () => {
    expect(formatActivityMetric(0, "unread")).toBe("Tout est à jour");
    expect(formatActivityMetric(3, "week")).toBe("3");
  });

  it("construit un empty state sans fake metrics", () => {
    const view = buildNotificationEmptyState("all", []);
    expect(view.title).toContain("calme");
    expect(notificationsHumanizeHasNoFakeMetrics([view.title, view.body])).toBe(true);
  });

  it("sélectionne des suggestions locales réelles", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const hints = buildLocalHintsFromTerritory({
      events: [
        {
          id: "e1",
          title: "Marché du samedi",
          starts_at: future,
          is_cancelled: false,
        } as LocalEvent,
      ],
      tribes: [{ id: "t1", slug: "velo", name: "Vélo Reims" } as Tribe],
      neighborhoods: [{ slug: "centre", display_name: "Centre-ville" } as Neighborhood],
      offerTitles: ["Café partenaire"],
    });
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0]?.href).toMatch(/^\/events\//);
  });

  it("utilise des fallbacks éditoriaux sans données territoire", () => {
    const suggestions = resolveEmptyStateSuggestions([]);
    expect(suggestions.length).toBe(3);
    expect(suggestions.every((hint) => hint.href.startsWith("/"))).toBe(true);
  });
});
