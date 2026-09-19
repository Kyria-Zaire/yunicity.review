import { describe, expect, it } from "vitest";

import {
  NEIGHBORHOODS_MEDIUM_AMBIANCE_CHIPS,
  neighborhoodsMediumActiveFilterCount,
  neighborhoodsMediumAmbiancesFromChip,
  neighborhoodsMediumSelectedChip,
} from "./neighborhoods-medium-presenter";

describe("neighborhoods-medium-presenter", () => {
  it("expose les chips maquette", () => {
    expect(NEIGHBORHOODS_MEDIUM_AMBIANCE_CHIPS.map((chip) => chip.id)).toEqual([
      "all",
      "lively",
      "cultural",
      "family",
      "student",
      "green",
    ]);
  });

  it("compte les filtres actifs", () => {
    expect(neighborhoodsMediumActiveFilterCount({ ambiances: [], query: "" })).toBe(0);
    expect(neighborhoodsMediumActiveFilterCount({ ambiances: ["lively", "green"], query: "x" })).toBe(
      3,
    );
  });

  it("dérive ambiances depuis le chip", () => {
    expect(neighborhoodsMediumAmbiancesFromChip("all")).toEqual([]);
    expect(neighborhoodsMediumAmbiancesFromChip("cultural")).toEqual(["cultural"]);
  });

  it("sélectionne le chip courant", () => {
    expect(neighborhoodsMediumSelectedChip([])).toBe("all");
    expect(neighborhoodsMediumSelectedChip(["family"])).toBe("family");
    expect(neighborhoodsMediumSelectedChip(["family", "green"])).toBe("all");
  });
});
