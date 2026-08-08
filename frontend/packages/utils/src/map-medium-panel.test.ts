import { describe, expect, it } from "vitest";

import { resolveMapMediumPanel } from "./map-medium-panel";

describe("resolveMapMediumPanel", () => {
  it("aucun état → aucun panneau", () => {
    expect(resolveMapMediumPanel({ filtersOpen: false, hasDetail: false })).toBe("none");
  });

  it("sélection seule → détail", () => {
    expect(resolveMapMediumPanel({ filtersOpen: false, hasDetail: true })).toBe("detail");
  });

  it("filtres seuls → filtres", () => {
    expect(resolveMapMediumPanel({ filtersOpen: true, hasDetail: false })).toBe("filters");
  });

  it("filtres + sélection → filtres prioritaire (masque le détail sans perdre la sélection)", () => {
    expect(resolveMapMediumPanel({ filtersOpen: true, hasDetail: true })).toBe("filters");
  });

  it("fermeture des filtres avec sélection encore présente → retour au détail", () => {
    // filtersOpen repasse à false, hasDetail reste true.
    expect(resolveMapMediumPanel({ filtersOpen: false, hasDetail: true })).toBe("detail");
  });

  it("fermeture du détail (sélection effacée par les handlers existants) → aucun panneau", () => {
    // hasDetail repasse à false après effacement de la sélection.
    expect(resolveMapMediumPanel({ filtersOpen: false, hasDetail: false })).toBe("none");
  });
});
