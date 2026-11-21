import { describe, expect, it } from "vitest";

import { computeScrollEdges, NO_SCROLL_EDGES } from "@/lib/layout/rail-scroll-edges";

/**
 * RAIL-SHORT-VIEWPORT-01 — un repère n'est affiché que du côté où du contenu
 * reste caché. Cas mesurés sur `0ceba225` (passation du ticket) : contenu de la
 * navigation 366 px, zone 334 px à 820 × 645, 289 px à 640 × 600.
 */
describe("computeScrollEdges", () => {
  it("returns no edge when the content fits", () => {
    expect(computeScrollEdges({ scrollTop: 0, clientHeight: 409, scrollHeight: 409 })).toEqual(NO_SCROLL_EDGES);
  });

  it("flags only the bottom edge at the top of an overflowing container", () => {
    expect(computeScrollEdges({ scrollTop: 0, clientHeight: 334, scrollHeight: 366 })).toEqual({
      above: false,
      below: true,
    });
  });

  it("flags only the top edge once scrolled to the end", () => {
    expect(computeScrollEdges({ scrollTop: 77, clientHeight: 289, scrollHeight: 366 })).toEqual({
      above: true,
      below: false,
    });
  });

  it("flags both edges in the middle", () => {
    expect(computeScrollEdges({ scrollTop: 30, clientHeight: 289, scrollHeight: 366 })).toEqual({
      above: true,
      below: true,
    });
  });

  it("ignores sub-pixel remainders from fractional layouts", () => {
    expect(computeScrollEdges({ scrollTop: 0.4, clientHeight: 365.6, scrollHeight: 366 })).toEqual(NO_SCROLL_EDGES);
  });

  it("returns no edge for degenerate metrics", () => {
    expect(computeScrollEdges({ scrollTop: 0, clientHeight: 0, scrollHeight: 0 })).toEqual(NO_SCROLL_EDGES);
  });
});
