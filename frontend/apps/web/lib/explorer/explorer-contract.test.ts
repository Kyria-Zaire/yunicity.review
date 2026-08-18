import { describe, expect, it } from "vitest";

import {
  EXPLORER_EMPTY_RECENT_LABEL,
  EXPLORER_VISITOR_HINT,
  buildExplorerLoginHref,
  buildExplorerSearchPath,
  isEditableShortcutTarget,
  isExplorerQuerySubmittable,
  resolveRealSearchCity,
  shouldShowExplorerEmptyRecent,
  shouldShowExplorerVisitorHint,
} from "./explorer-contract";

describe("buildExplorerSearchPath", () => {
  it("retourne /search sans paramètres", () => {
    expect(buildExplorerSearchPath({})).toBe("/search");
  });

  it("trim et encode la requête", () => {
    expect(buildExplorerSearchPath({ query: "  marché local  " })).toBe("/search?q=march%C3%A9+local");
  });

  it("conserve une requête partielle pour la destination next", () => {
    expect(buildExplorerSearchPath({ query: "x", city: " Reims " })).toBe("/search?q=x&city=Reims");
  });

  it("ignore une ville vide après trim", () => {
    expect(buildExplorerSearchPath({ query: "x", city: " " })).toBe("/search?q=x");
  });

  it("ne laisse jamais une charge malveillante modifier le pathname", () => {
    const path = buildExplorerSearchPath({ query: "/evil" });
    expect(path.startsWith("/search")).toBe(true);
    expect(new URL(path, "http://local").pathname).toBe("/search");
    expect(new URL(path, "http://local").searchParams.get("q")).toBe("/evil");
  });
});

describe("buildExplorerLoginHref", () => {
  it("encode une destination interne sûre vers /login", () => {
    const next = decodeURIComponent(
      new URL(buildExplorerLoginHref({}), "http://local").searchParams.get("next")!,
    );
    expect(next).toBe("/search");
  });

  it("préserve le brouillon de recherche dans next", () => {
    const href = buildExplorerLoginHref({ query: "café", city: "Reims" });
    const next = decodeURIComponent(new URL(href, "http://local").searchParams.get("next")!);
    expect(next).toBe("/search?q=café&city=Reims");
    expect(href.startsWith("/login?")).toBe(true);
  });
});

describe("resolveRealSearchCity", () => {
  it("retourne la première ville réelle non vide", () => {
    expect(resolveRealSearchCity(undefined, "", " Reims ", null)).toBe("Reims");
    expect(resolveRealSearchCity("")).toBeNull();
  });
});

describe("Explorer — copy et états honnêtes", () => {
  it("expose le message visiteur exact, sans promesse de recherche publique", () => {
    expect(EXPLORER_VISITOR_HINT).toBe(
      "Connectez-vous pour rechercher dans Reims et accéder aux résultats.",
    );
    expect(shouldShowExplorerVisitorHint(false)).toBe(true);
    expect(shouldShowExplorerVisitorHint(true)).toBe(false);
  });

  it("affiche Aucune recherche récente seulement si connecté, champ vide et historique réel absent", () => {
    expect(EXPLORER_EMPTY_RECENT_LABEL).toBe("Aucune recherche récente");
    expect(
      shouldShowExplorerEmptyRecent({ isAuthenticated: true, query: "", recentSearches: [] }),
    ).toBe(true);
    expect(
      shouldShowExplorerEmptyRecent({ isAuthenticated: true, query: "   ", recentSearches: [] }),
    ).toBe(true);
    expect(
      shouldShowExplorerEmptyRecent({ isAuthenticated: false, query: "", recentSearches: [] }),
    ).toBe(false);
    expect(
      shouldShowExplorerEmptyRecent({ isAuthenticated: true, query: "ab", recentSearches: [] }),
    ).toBe(false);
    expect(
      shouldShowExplorerEmptyRecent({
        isAuthenticated: true,
        query: "",
        recentSearches: ["marché"],
      }),
    ).toBe(false);
  });
});

describe("isExplorerQuerySubmittable", () => {
  it("délègue au contrat isSearchQueryReady existant", () => {
    expect(isExplorerQuerySubmittable("a")).toBe(false);
    expect(isExplorerQuerySubmittable("ab")).toBe(true);
    expect(isExplorerQuerySubmittable("  ab  ")).toBe(true);
  });
});

describe("isEditableShortcutTarget", () => {
  function mockElement(closest: HTMLElement | null): HTMLElement {
    return {
      closest: () => closest,
    } as unknown as HTMLElement;
  }

  it("ignore les zones éditables et leurs descendants", () => {
    const input = mockElement({} as HTMLElement);
    expect(isEditableShortcutTarget(input)).toBe(true);

    const nested = mockElement(null);
    expect(isEditableShortcutTarget(nested)).toBe(false);

    expect(isEditableShortcutTarget(null)).toBe(false);
  });
});
