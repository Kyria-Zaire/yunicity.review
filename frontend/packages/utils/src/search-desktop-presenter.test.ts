import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchGroups } from "@yunicity/types";

import { emptySearchGroups } from "./search-labels";
import {
  buildSearchDesktopOtherRows,
  buildSearchDesktopResultSections,
  defaultSearchDesktopContentTypes,
  searchDesktopPeriodToApi,
} from "./search-desktop-presenter";
import { addRecentSearch, clearRecentSearches, loadRecentSearches } from "./search-recent-searches";

describe("searchDesktopPeriodToApi", () => {
  it("mappe les presets vers upcoming sauf all", () => {
    expect(searchDesktopPeriodToApi("all")).toBe("all");
    expect(searchDesktopPeriodToApi("today")).toBe("upcoming");
    expect(searchDesktopPeriodToApi("week")).toBe("upcoming");
  });
});

describe("buildSearchDesktopPrimarySections", () => {
  it("ordonne les groupes principaux visibles", () => {
    const groups = emptySearchGroups();
    groups.events = {
      items: [{ id: "e1", rank: 1, title: "Sortie photo" }],
      count: 1,
      has_more: false,
    };
    groups.tribes = {
      items: [{ id: "t1", rank: 1, name: "Tribu Photo" }],
      count: 1,
      has_more: false,
    };

    const sections = buildSearchDesktopResultSections({
      groups,
      typeFilter: "all",
      query: "photo",
      city: "Reims",
      enabledContentTypes: defaultSearchDesktopContentTypes(),
    });

    expect(sections.map((section) => section.key)).toEqual(["events", "tribes"]);
    expect(sections[0]?.label).toBe("Sorties");
  });

  it("masque les groupes désactivés via checkboxes", () => {
    const groups = emptySearchGroups();
    groups.events = {
      items: [{ id: "e1", rank: 1, title: "Sortie" }],
      count: 1,
      has_more: false,
    };

    const sections = buildSearchDesktopResultSections({
      groups,
      typeFilter: "all",
      query: "sortie",
      city: "Reims",
      enabledContentTypes: ["post", "organization"],
    });

    expect(sections).toHaveLength(0);
  });
});

describe("buildSearchDesktopOtherRows", () => {
  it("agrège les groupes secondaires en Autres résultats", () => {
    const groups = emptySearchGroups();
    groups.offers = {
      items: [{ id: "o1", rank: 1, title: "Offre photo" }],
      count: 1,
      has_more: false,
    };

    const rows = buildSearchDesktopOtherRows({
      groups,
      typeFilter: "all",
      query: "photo",
      city: "Reims",
      enabledContentTypes: defaultSearchDesktopContentTypes(),
      rowLabel: (_, title) => title,
      rowSubtitle: (key, count) => `${key}:${count}`,
      rowHref: () => "/search?tab=passport",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.groupKey).toBe("offers");
  });
});

describe("search recent storage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
    clearRecentSearches();
  });

  it("ajoute sans doublon et limite la taille", () => {
    addRecentSearch("photo");
    addRecentSearch("jazz");
    addRecentSearch("photo");
    const recent = loadRecentSearches();
    expect(recent[0]).toBe("photo");
    expect(recent[1]).toBe("jazz");
  });
});
