import { describe, expect, it } from "vitest";

import {
  SEARCH_GROUP_LABELS,
  SEARCH_GROUP_ORDER,
  SEARCH_TAB_SLUGS,
  SEARCH_TYPE_TABS,
  emptySearchGroups,
  isSearchInitialState,
  isSearchQueryReady,
  searchResultHref,
  searchResultSubtitle,
  searchResultTitle,
  searchTabFromUrlParam,
  searchTabToUrlParam,
  searchTypeFilterFromApi,
  searchTypeToApiParam,
  visibleSearchGroups,
} from "./search-labels";

describe("searchTypeToApiParam", () => {
  it("mappe organization vers org", () => {
    expect(searchTypeToApiParam("organization")).toBe("org");
    expect(searchTypeToApiParam("event")).toBe("event");
    expect(searchTypeToApiParam("all")).toBe("all");
  });
});

describe("searchTypeFilterFromApi", () => {
  it("mappe org vers organization", () => {
    expect(searchTypeFilterFromApi("org")).toBe("organization");
    expect(searchTypeFilterFromApi("all")).toBe("all");
  });
});

describe("isSearchQueryReady", () => {
  it("exige au moins 2 caractères", () => {
    expect(isSearchQueryReady("a")).toBe(false);
    expect(isSearchQueryReady("ab")).toBe(true);
  });
});

describe("isSearchInitialState", () => {
  it("reste initial tant que la requête est trop courte", () => {
    expect(isSearchInitialState("", false)).toBe(true);
    expect(isSearchInitialState("a", false)).toBe(true);
    expect(isSearchInitialState("ab", true)).toBe(false);
  });
});

describe("emptySearchGroups", () => {
  it("expose les 7 groupes vides", () => {
    const groups = emptySearchGroups();
    expect(SEARCH_GROUP_ORDER.every((key) => groups[key].count === 0)).toBe(true);
  });
});

describe("searchResultTitle", () => {
  it("préfère title puis name puis username", () => {
    expect(searchResultTitle({ id: "1", rank: 1, title: "Café" })).toBe("Café");
    expect(searchResultTitle({ id: "1", rank: 1, name: "Lieu" })).toBe("Lieu");
    expect(searchResultTitle({ id: "1", rank: 1, username: "marie" })).toBe("marie");
  });
});

describe("searchResultSubtitle", () => {
  it("tronque le corps des posts", () => {
    const long = "x".repeat(150);
    const sub = searchResultSubtitle({ id: "1", rank: 1, body: long }, "posts", "Reims");
    expect(sub.length).toBeLessThan(150);
  });
});

describe("searchResultHref", () => {
  it("lie un événement vers sa fiche", () => {
    const href = searchResultHref(
      { id: "ev-1", rank: 1, title: "Concert" },
      "events",
      "Reims",
    );
    expect(href?.web).toBe("/events/ev-1");
  });

  it("ne lie pas les posts (pas de fiche publique)", () => {
    expect(
      searchResultHref({ id: "p-1", rank: 1, body: "hello" }, "posts", "Reims"),
    ).toBeNull();
  });
});

describe("visibleSearchGroups", () => {
  it("filtre par type", () => {
    const groups = emptySearchGroups();
    groups.posts = { items: [{ id: "1", rank: 1, body: "x" }], count: 1, has_more: false };
    const visible = visibleSearchGroups(groups, "post");
    expect(visible).toHaveLength(1);
    expect(visible[0]?.key).toBe("posts");
  });
});

describe("SEARCH_TYPE_TABS", () => {
  it("inclut Tous en premier", () => {
    expect(SEARCH_TYPE_TABS[0]?.value).toBe("all");
    expect(SEARCH_GROUP_LABELS.posts).toBe("Publications");
  });
});

describe("searchTabFromUrlParam", () => {
  it("mappe les slugs français vers SearchTypeFilter", () => {
    expect(searchTabFromUrlParam("lieux")).toBe("organization");
    expect(searchTabFromUrlParam("moments")).toBe("post");
    expect(searchTabFromUrlParam("evenements")).toBe("event");
    expect(searchTabFromUrlParam("quartiers")).toBe("neighborhood");
    expect(searchTabFromUrlParam("tribus")).toBe("tribe");
    expect(searchTabFromUrlParam("passport")).toBe("offer");
  });

  it("retourne all pour slug inconnu ou vide", () => {
    expect(searchTabFromUrlParam(null)).toBe("all");
    expect(searchTabFromUrlParam("")).toBe("all");
    expect(searchTabFromUrlParam("inconnu")).toBe("all");
  });
});

describe("searchTabToUrlParam", () => {
  it("retourne null pour all", () => {
    expect(searchTabToUrlParam("all")).toBeNull();
  });

  it("retourne le slug pour les autres tabs", () => {
    expect(searchTabToUrlParam("organization")).toBe("lieux");
    expect(searchTabToUrlParam("post")).toBe("moments");
  });
});

describe("SEARCH_TAB_SLUGS", () => {
  it("couvre tous les tabs exposés dans l'UI", () => {
    for (const tab of SEARCH_TYPE_TABS) {
      expect(SEARCH_TAB_SLUGS[tab.value]).toBeTruthy();
    }
  });
});
