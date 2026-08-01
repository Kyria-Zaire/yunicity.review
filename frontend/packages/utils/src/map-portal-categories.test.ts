import { describe, expect, it } from "vitest";

import { CULTURAL_PLACE_CATEGORIES } from "./cultural-place-labels";
import { resolveMapPortalPlaceCategories } from "./map-portal";

describe("resolveMapPortalPlaceCategories — aucune catégorie ne disparaît (T1, famille #167)", () => {
  const culture = resolveMapPortalPlaceCategories("culture") ?? [];
  const nature = resolveMapPortalPlaceCategories("nature") ?? [];

  it("chaque catégorie connue apparaît sous culture OU nature (jamais aucune)", () => {
    for (const category of CULTURAL_PLACE_CATEGORIES) {
      expect(culture.includes(category) || nature.includes(category)).toBe(true);
    }
  });

  it("les 5 cas identifiés (market, square, sport, winery) sont bien sous culture", () => {
    for (const category of ["market", "square", "sport", "winery"]) {
      expect(culture).toContain(category);
    }
  });

  it("park est sous nature", () => {
    expect(nature).toContain("park");
  });

  it("les catégories patrimoniales de base restent sous culture", () => {
    for (const category of ["museum", "heritage", "cathedral", "theatre", "library", "monument"]) {
      expect(culture).toContain(category);
    }
  });

  it("« places » (toutes) ne filtre pas par catégorie", () => {
    expect(resolveMapPortalPlaceCategories("places")).toBeNull();
  });
});
