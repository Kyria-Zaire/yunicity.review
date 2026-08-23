import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  resolveYunicityMenuHostVariant,
  resolveYunicityMenuPopoverPlacement,
} from "./yunicity-menu-host";

describe("resolveYunicityMenuHostVariant", () => {
  it("n'interprète pas un viewport non résolu (0) comme du mobile", () => {
    // R1B : l'hote medium porte desormais une variante DISTINCTE.
    expect(resolveYunicityMenuHostVariant(0)).toBe("medium-rail");
  });

  it("monte Menu depuis le header mobile à 390", () => {
    expect(resolveYunicityMenuHostVariant(390)).toBe("mobile-header");
  });

  it("monte Menu depuis l'hôte medium à 900", () => {
    expect(resolveYunicityMenuHostVariant(900)).toBe("medium-rail");
  });

  it("conserve l'hôte medium Sheet juste sous le palier desktop", () => {
    expect(resolveYunicityMenuHostVariant(1279)).toBe("medium-rail");
  });

  it("monte Menu depuis le header dès 1280 pour ancrer le Popover au déclencheur visible", () => {
    expect(resolveYunicityMenuHostVariant(1280)).toBe("top-nav");
  });

  it("monte Menu depuis le header à 1366", () => {
    expect(resolveYunicityMenuHostVariant(1366)).toBe("top-nav");
  });
});

describe("resolveYunicityMenuPopoverPlacement", () => {
  it("aligne le Popover header sous le déclencheur, bord droit contre bord droit", () => {
    expect(resolveYunicityMenuPopoverPlacement("top-nav")).toBe("bottom-end");
  });

  it("conserve l'ouverture à droite depuis la sidebar élargie", () => {
    expect(resolveYunicityMenuPopoverPlacement("sidebar")).toBe("right-start");
  });
});

/**
 * C3-CITIZEN-MEDIUM-SHELL-R1B — separation des hotes.
 *
 * `WebSidebar` monte DEUX instances de `CitizenYunicityMenu` : celle de la
 * sidebar desktop et celle du rail citoyen. Tant qu'elles partageaient
 * `variant="sidebar"`, elles s'elisaient toutes deux hotes et la restitution du
 * focus ne fonctionnait que grace a l'ordre de montage.
 */
describe("R1B — hote medium distinct et election globale", () => {
  const lire = (rel: string) =>
    readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf-8");

  it("rail present : l'hote medium est `medium-rail`", () => {
    for (const w of [640, 768, 834, 1024, 1279]) {
      expect(resolveYunicityMenuHostVariant(w, { mediumRailPresent: true })).toBe("medium-rail");
    }
  });

  it("rail absent (route exclue) : l'hote medium redevient `sidebar`", () => {
    for (const w of [640, 768, 834, 1024, 1279]) {
      expect(resolveYunicityMenuHostVariant(w, { mediumRailPresent: false })).toBe("sidebar");
    }
  });

  it("le fait global n'affecte JAMAIS les paliers mobile et desktop", () => {
    for (const present of [true, false]) {
      expect(resolveYunicityMenuHostVariant(320, { mediumRailPresent: present })).toBe(
        "mobile-header",
      );
      expect(resolveYunicityMenuHostVariant(639, { mediumRailPresent: present })).toBe(
        "mobile-header",
      );
      expect(resolveYunicityMenuHostVariant(1280, { mediumRailPresent: present })).toBe("top-nav");
      expect(resolveYunicityMenuHostVariant(1920, { mediumRailPresent: present })).toBe("top-nav");
    }
  });

  it("un seul hote par largeur ET par contexte", () => {
    for (const w of [320, 639, 640, 768, 1279, 1280, 1920]) {
      for (const present of [true, false]) {
        const a = resolveYunicityMenuHostVariant(w, { mediumRailPresent: present });
        const b = resolveYunicityMenuHostVariant(w, { mediumRailPresent: present });
        expect(a).toBe(b);
      }
    }
  });

  it("un seul hote par largeur, sur toute la plage", () => {
    const hotes = new Set(
      [320, 639, 640, 768, 1279, 1280, 1920].map((w) => resolveYunicityMenuHostVariant(w)),
    );
    expect([...hotes].sort()).toEqual(["medium-rail", "mobile-header", "top-nav"]);
  });

  it("`medium-rail` partage le placement de `sidebar` : aucun delta visuel", () => {
    expect(resolveYunicityMenuPopoverPlacement("medium-rail")).toBe(
      resolveYunicityMenuPopoverPlacement("sidebar"),
    );
  });

  it("le rail porte TOUJOURS la variante `medium-rail`", () => {
    const rail = lire("../../components/layout/citizen-medium-rail.tsx");
    expect(rail).toMatch(/<CitizenYunicityMenu\s+variant="medium-rail"/);
    expect(rail).not.toMatch(/<CitizenYunicityMenu\s+variant="sidebar"/);
  });

  it("WebSidebar porte TOUJOURS la variante `sidebar`", () => {
    const sidebar = lire("../../components/layout/web-sidebar.tsx");
    expect(sidebar).toMatch(/<CitizenYunicityMenu\s+variant="sidebar"/);
  });

  it("aucun ternaire d'eligibilite ne subsiste sur la prop `variant`", () => {
    // R1C : l'apparence ne depend plus de la route. Seul le FAIT global transite.
    for (const rel of [
      "../../components/layout/web-sidebar.tsx",
      "../../components/layout/citizen-medium-rail.tsx",
    ]) {
      expect(lire(rel)).not.toMatch(/variant=\{[^}]*\?/);
    }
    expect(lire("../../components/layout/web-sidebar.tsx")).toMatch(
      /mediumRailPresent=\{medium\.eligible\}/,
    );
  });

  it("le fait global n'est jamais infere depuis la variante de l'instance", () => {
    const menu = lire("../../components/layout/citizen-yunicity-menu.tsx");
    expect(menu).not.toMatch(/mediumRailPresent:\s*variant\s*!==/);
    expect(menu).toMatch(/resolveYunicityMenuHostVariant\([^)]*viewportWidth[^)]*,/);
  });
});
