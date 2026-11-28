import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  CITIZEN_BOTTOM_NAV_HEIGHT_VAR,
  CITIZEN_MOBILE_BOTTOM_NAV_PADDING,
} from "@/lib/layout/feed-mobile-refonte";

/**
 * BOTTOM-NAV-RESERVE-01 — réserve sous la barre basse mobile.
 *
 * Tailwind ne génère une classe que s'il la TROUVE écrite dans le source. La
 * constante était assemblée par interpolation : la classe n'existait dans aucune
 * feuille de style et la réserve était inopérante sur tous les shells citoyens.
 */
describe("réserve sous la barre basse mobile (BOTTOM-NAV-RESERVE-01)", () => {
  const source = readFileSync(fileURLToPath(new URL("./feed-mobile-refonte.ts", import.meta.url)), "utf8");

  it("écrit la classe en toutes lettres dans le source, là où Tailwind la cherche", () => {
    expect(source).toContain(`"${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}"`);
  });

  it("réserve la hauteur MESURÉE de la barre, au seul palier mobile, et rien sans mesure", () => {
    expect(CITIZEN_MOBILE_BOTTOM_NAV_PADDING).toBe(`max-[639px]:pb-[var(${CITIZEN_BOTTOM_NAV_HEIGHT_VAR},0px)]`);
  });
});
