import { describe, expect, it } from "vitest";

import {
  acquireScrollLock,
  activeScrollLockCount,
  canCloseOverlay,
  closedTransform,
  enteredTransform,
  longestTransitionMs,
  overlayPhase,
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

describe("closedTransform / enteredTransform / panelPositionClass", () => {
  it("sort par le bon bord selon le côté", () => {
    expect(closedTransform("left")).toBe("translateX(-100%)");
    expect(closedTransform("right")).toBe("translateX(100%)");
    expect(closedTransform("bottom")).toBe("translateY(100%)");
  });

  it("anime le Dialog centré avec scale et translateY", () => {
    expect(closedTransform("center")).toBe("translateY(0.5rem) scale(0.96)");
    expect(enteredTransform("center")).toBe("translateY(0) scale(1)");
  });

  it("ancre le panneau du bon côté", () => {
    expect(panelPositionClass("left")).toContain("left-0");
    expect(panelPositionClass("right")).toContain("right-0");
    expect(panelPositionClass("bottom")).toContain("bottom-0");
    expect(panelPositionClass("bottom")).toContain("overflow-hidden");
    expect(panelPositionClass("bottom")).toContain("max-h-[85dvh]");
  });

  it("positionne le Dialog centré en relative dans un conteneur flex", () => {
    expect(panelPositionClass("center")).toContain("relative");
    expect(panelPositionClass("center")).not.toContain("translate");
  });

  it("utilise translate(0) pour les panneaux latéraux ouverts", () => {
    expect(enteredTransform("left")).toBe("translate(0, 0)");
    expect(enteredTransform("right")).toBe("translate(0, 0)");
    expect(enteredTransform("bottom")).toBe("translate(0, 0)");
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

describe("longestTransitionMs (C3.1-R1E)", () => {
  it("retourne 0 quand aucune transition n'est declaree", () => {
    expect(longestTransitionMs("")).toBe(0);
    expect(longestTransitionMs("0s")).toBe(0);
    expect(longestTransitionMs("0ms")).toBe(0);
  });

  it("convertit secondes et millisecondes", () => {
    expect(longestTransitionMs("200ms")).toBe(200);
    expect(longestTransitionMs("0.25s")).toBe(250);
  });

  it("retient la plus longue duree d'une liste", () => {
    expect(longestTransitionMs("0.2s, 0.3s")).toBe(300);
    expect(longestTransitionMs("300ms, 0.1s")).toBe(300);
  });

  it("ignore les valeurs illisibles plutot que de bloquer la readiness", () => {
    expect(longestTransitionMs("auto")).toBe(0);
    expect(longestTransitionMs("0.2s, nope")).toBe(200);
  });
});

describe("overlayPhase (C3.1-R1E)", () => {
  it("annonce entering tant que la transition d'entree n'est pas terminee", () => {
    expect(overlayPhase(false)).toBe("entering");
  });

  it("annonce entered une fois la transition terminee", () => {
    expect(overlayPhase(true)).toBe("entered");
  });
});
