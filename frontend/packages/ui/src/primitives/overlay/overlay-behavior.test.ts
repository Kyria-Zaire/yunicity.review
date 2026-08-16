import { describe, expect, it } from "vitest";

import {
  acquireScrollLock,
  activeScrollLockCount,
  canCloseOverlay,
  closedTransform,
  panelPositionClass,
  resolveTabTrap,
} from "./overlay-behavior";

describe("canCloseOverlay", () => {
  it("autorise toujours le bouton Close, même non dismissible", () => {
    expect(canCloseOverlay(false, "close-button")).toBe(true);
    expect(canCloseOverlay(true, "close-button")).toBe(true);
  });

  it("refuse Escape et le clic overlay quand dismissible est false", () => {
    expect(canCloseOverlay(false, "escape")).toBe(false);
    expect(canCloseOverlay(false, "overlay-click")).toBe(false);
  });

  it("autorise Escape et le clic overlay quand dismissible est true", () => {
    expect(canCloseOverlay(true, "escape")).toBe(true);
    expect(canCloseOverlay(true, "overlay-click")).toBe(true);
  });
});

describe("resolveTabTrap", () => {
  it("bloque Tab quand le panneau n'a aucun élément focalisable", () => {
    expect(resolveTabTrap({ focusableCount: 0, activeIndex: -1, shiftKey: false })).toEqual({
      preventDefault: true,
      focusIndex: null,
    });
  });

  it("ramène le focus dans le panneau lorsqu'il est sorti", () => {
    expect(resolveTabTrap({ focusableCount: 3, activeIndex: -1, shiftKey: false })).toEqual({
      preventDefault: true,
      focusIndex: 0,
    });
  });

  it("boucle du dernier au premier avec Tab", () => {
    expect(resolveTabTrap({ focusableCount: 3, activeIndex: 2, shiftKey: false })).toEqual({
      preventDefault: true,
      focusIndex: 0,
    });
  });

  it("boucle du premier au dernier avec Shift+Tab", () => {
    expect(resolveTabTrap({ focusableCount: 3, activeIndex: 0, shiftKey: true })).toEqual({
      preventDefault: true,
      focusIndex: 2,
    });
  });

  it("laisse la navigation native au milieu du panneau", () => {
    expect(resolveTabTrap({ focusableCount: 3, activeIndex: 1, shiftKey: false })).toEqual({
      preventDefault: false,
      focusIndex: null,
    });
    expect(resolveTabTrap({ focusableCount: 3, activeIndex: 1, shiftKey: true })).toEqual({
      preventDefault: false,
      focusIndex: null,
    });
  });

  it("reste cohérent avec un seul élément focalisable", () => {
    expect(resolveTabTrap({ focusableCount: 1, activeIndex: 0, shiftKey: false })).toEqual({
      preventDefault: true,
      focusIndex: 0,
    });
    expect(resolveTabTrap({ focusableCount: 1, activeIndex: 0, shiftKey: true })).toEqual({
      preventDefault: true,
      focusIndex: 0,
    });
  });
});

describe("closedTransform / panelPositionClass", () => {
  it("sort par le bon bord selon le côté", () => {
    expect(closedTransform("left")).toBe("translateX(-100%)");
    expect(closedTransform("right")).toBe("translateX(100%)");
    expect(closedTransform("bottom")).toBe("translateY(100%)");
  });

  it("ancre le panneau du bon côté", () => {
    expect(panelPositionClass("left")).toContain("left-0");
    expect(panelPositionClass("right")).toContain("right-0");
    expect(panelPositionClass("bottom")).toContain("bottom-0");
  });
});

describe("acquireScrollLock", () => {
  it("verrouille, reste verrouillé tant qu'un overlay est ouvert, puis restaure", () => {
    const target = { style: { overflow: "auto" } };

    const releaseFirst = acquireScrollLock(target);
    expect(target.style.overflow).toBe("hidden");

    const releaseSecond = acquireScrollLock(target);
    releaseFirst();
    expect(target.style.overflow).toBe("hidden"); // overlay imbriqué encore ouvert

    releaseSecond();
    expect(target.style.overflow).toBe("auto"); // valeur d'origine restaurée
    expect(activeScrollLockCount()).toBe(0);
  });

  it("est idempotent : une libération répétée ne décrémente pas deux fois", () => {
    const target = { style: { overflow: "" } };
    const release = acquireScrollLock(target);
    release();
    release();
    expect(activeScrollLockCount()).toBe(0);
  });

  it("ne casse pas sans cible (rendu serveur)", () => {
    const release = acquireScrollLock(null);
    expect(() => release()).not.toThrow();
    expect(activeScrollLockCount()).toBe(0);
  });
});
