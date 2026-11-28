import { describe, expect, it } from "vitest";

import {
  NEIGHBORHOODS_DESKTOP_KICKER,
  NEIGHBORHOODS_EXPLORE_PAGE_COUNT,
} from "./neighborhoods-desktop-labels";

describe("NEIGHBORHOODS_DESKTOP_KICKER — pluralisation", () => {
  it("affiche 1 QUARTIER au singulier", () => {
    expect(NEIGHBORHOODS_DESKTOP_KICKER("Reims", 1)).toBe("REIMS · 1 QUARTIER");
  });

  it("affiche 12 QUARTIERS au pluriel", () => {
    expect(NEIGHBORHOODS_DESKTOP_KICKER("Reims", 12)).toBe("REIMS · 12 QUARTIERS");
  });

  it("n'utilise pas la forme singulière pour 12", () => {
    const kicker = NEIGHBORHOODS_DESKTOP_KICKER("Reims", 12);
    expect(kicker).toBe("REIMS · 12 QUARTIERS");
    expect(kicker).not.toMatch(/12 QUARTIER(?!S)/);
  });
});

describe("NEIGHBORHOODS_EXPLORE_PAGE_COUNT — pluralisation", () => {
  it("affiche 1 quartier au singulier", () => {
    expect(NEIGHBORHOODS_EXPLORE_PAGE_COUNT(1)).toBe("1 quartier");
  });

  it("affiche 12 quartiers au pluriel", () => {
    expect(NEIGHBORHOODS_EXPLORE_PAGE_COUNT(12)).toBe("12 quartiers");
  });
});
