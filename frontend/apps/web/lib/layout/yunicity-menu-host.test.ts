import { describe, expect, it } from "vitest";

import {
  resolveYunicityMenuHostVariant,
  resolveYunicityMenuPopoverPlacement,
} from "./yunicity-menu-host";

describe("resolveYunicityMenuHostVariant", () => {
  it("n'interprète pas un viewport non résolu (0) comme du mobile", () => {
    expect(resolveYunicityMenuHostVariant(0)).toBe("sidebar");
  });

  it("monte Menu depuis le header mobile à 390", () => {
    expect(resolveYunicityMenuHostVariant(390)).toBe("mobile-header");
  });

  it("monte Menu depuis la sidebar à 900", () => {
    expect(resolveYunicityMenuHostVariant(900)).toBe("sidebar");
  });

  it("conserve la sidebar comme hôte Sheet juste sous le palier desktop", () => {
    expect(resolveYunicityMenuHostVariant(1279)).toBe("sidebar");
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
