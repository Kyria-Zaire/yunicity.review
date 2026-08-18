import { describe, expect, it } from "vitest";

import {
  DESKTOP_HEADER_MIN_GAP_PX,
  allControlsWithinViewport,
  destinationControlId,
  findOverlappingPairs,
  minInteractiveTargetSize,
  rectsOverlap,
  type HeaderControlRect,
} from "./desktop-header-geometry";

function rect(
  id: HeaderControlRect["id"],
  left: number,
  width: number,
  top = 0,
  height = 44,
): HeaderControlRect {
  return {
    id,
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height,
  };
}

describe("desktop-header-geometry", () => {
  it("mappe les hrefs canoniques vers les ids de contrôle", () => {
    expect(destinationControlId("/feed")).toBe("destination-feed");
    expect(destinationControlId("/sortir")).toBe("destination-sortir");
  });

  it("détecte un chevauchement sans gap", () => {
    expect(rectsOverlap(rect("explorer", 100, 80), rect("destination-map", 150, 60))).toBe(true);
  });

  it("accepte un écart >= minGap sans collision", () => {
    const a = rect("explorer", 100, 80);
    const b = rect("destination-map", 100 + 80 + DESKTOP_HEADER_MIN_GAP_PX, 60);
    expect(rectsOverlap(a, b, DESKTOP_HEADER_MIN_GAP_PX)).toBe(false);
  });

  it("retourne les paires qui se chevauchent", () => {
    const pairs = findOverlappingPairs([
      rect("logo", 0, 120),
      rect("destination-map", 500, 70),
      rect("explorer", 520, 160),
    ]);
    expect(pairs).toEqual([["destination-map", "explorer"]]);
  });

  it("valide que tous les contrôles restent dans le viewport", () => {
    expect(
      allControlsWithinViewport([rect("menu", 1200, 120)], 1366),
    ).toBe(true);
    expect(
      allControlsWithinViewport([rect("menu", 1300, 120)], 1366),
    ).toBe(false);
  });

  it("valide la taille minimale des cibles utilitaires", () => {
    expect(
      minInteractiveTargetSize(
        [rect("notifications", 0, 44, 0, 44), rect("account", 50, 40, 0, 44)],
        ["notifications", "account"],
      ),
    ).toBe(false);
  });
});
