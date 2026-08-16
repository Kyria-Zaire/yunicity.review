import { describe, expect, it } from "vitest";

import {
  isTopmostOverlay,
  OVERLAY_ROOT_ATTRIBUTE,
  overlayStackSize,
  registerOverlay,
} from "./overlay-stack";

/** Crée un enfant direct de `body` (contenu applicatif ou racine de portail). */
function appendChild(options: { overlayRoot?: boolean; ariaHidden?: string } = {}): HTMLElement {
  const element = document.createElement("div");
  if (options.overlayRoot) element.setAttribute(OVERLAY_ROOT_ATTRIBUTE, "");
  if (options.ariaHidden !== undefined) element.setAttribute("aria-hidden", options.ariaHidden);
  document.body.appendChild(element);
  return element;
}

function isNeutralized(element: HTMLElement): boolean {
  return element.getAttribute("aria-hidden") === "true" && element.getAttribute("inert") === "";
}

describe("overlayStack — sommet unique", () => {
  it("neutralise tout sauf la racine au sommet", () => {
    const app = appendChild();
    const rootA = appendChild({ overlayRoot: true });

    const leaveA = registerOverlay(rootA);

    expect(isNeutralized(app)).toBe(true);
    expect(isNeutralized(rootA)).toBe(false);
    expect(isTopmostOverlay(rootA)).toBe(true);
    expect(overlayStackSize()).toBe(1);

    leaveA();
    app.remove();
    rootA.remove();
  });

  it("neutralise l'overlay sous-jacent quand un second s'ouvre", () => {
    const app = appendChild();
    const rootA = appendChild({ overlayRoot: true });
    const rootB = appendChild({ overlayRoot: true });

    const leaveA = registerOverlay(rootA);
    const leaveB = registerOverlay(rootB);

    expect(isNeutralized(app)).toBe(true);
    expect(isNeutralized(rootA)).toBe(true); // A reste monté mais inactif
    expect(isNeutralized(rootB)).toBe(false);
    expect(isTopmostOverlay(rootB)).toBe(true);
    expect(isTopmostOverlay(rootA)).toBe(false);

    leaveB();
    leaveA();
    app.remove();
    rootA.remove();
    rootB.remove();
  });

  it("réactive la couche précédente à la fermeture du sommet", () => {
    const app = appendChild();
    const rootA = appendChild({ overlayRoot: true });
    const rootB = appendChild({ overlayRoot: true });

    const leaveA = registerOverlay(rootA);
    const leaveB = registerOverlay(rootB);

    leaveB();

    expect(isNeutralized(rootA)).toBe(false); // A redevient actif
    expect(isTopmostOverlay(rootA)).toBe(true);
    expect(isNeutralized(app)).toBe(true); // l'application reste inerte

    leaveA();
    app.remove();
    rootA.remove();
    rootB.remove();
  });

  it("supporte trois niveaux d'imbrication", () => {
    const app = appendChild();
    const roots = [appendChild({ overlayRoot: true }), appendChild({ overlayRoot: true }), appendChild({ overlayRoot: true })];
    const leaves = roots.map((root) => registerOverlay(root));

    expect(overlayStackSize()).toBe(3);
    expect(isTopmostOverlay(roots[2] ?? null)).toBe(true);
    expect(isNeutralized(roots[0] as HTMLElement)).toBe(true);
    expect(isNeutralized(roots[1] as HTMLElement)).toBe(true);

    leaves[2]?.();
    expect(isTopmostOverlay(roots[1] ?? null)).toBe(true);
    expect(isNeutralized(roots[1] as HTMLElement)).toBe(false);

    leaves[1]?.();
    expect(isTopmostOverlay(roots[0] ?? null)).toBe(true);
    expect(isNeutralized(app)).toBe(true);

    leaves[0]?.();
    expect(overlayStackSize()).toBe(0);
    expect(isNeutralized(app)).toBe(false);

    app.remove();
    for (const root of roots) root.remove();
  });
});

describe("overlayStack — fermeture dans le désordre", () => {
  it("retire un overlay sous-jacent sans déstabiliser le sommet", () => {
    const app = appendChild();
    const rootA = appendChild({ overlayRoot: true });
    const rootB = appendChild({ overlayRoot: true });

    const leaveA = registerOverlay(rootA);
    const leaveB = registerOverlay(rootB);

    leaveA(); // A se ferme alors que B est encore ouvert

    expect(overlayStackSize()).toBe(1);
    expect(isTopmostOverlay(rootB)).toBe(true);
    expect(isNeutralized(rootB)).toBe(false);
    expect(isNeutralized(app)).toBe(true); // l'application reste inerte

    leaveB();
    app.remove();
    rootA.remove();
    rootB.remove();
  });

  it("est idempotent : une sortie répétée ne dépile pas deux fois", () => {
    const rootA = appendChild({ overlayRoot: true });
    const rootB = appendChild({ overlayRoot: true });

    const leaveA = registerOverlay(rootA);
    const leaveB = registerOverlay(rootB);

    leaveA();
    leaveA();
    leaveA();

    expect(overlayStackSize()).toBe(1);
    expect(isTopmostOverlay(rootB)).toBe(true);

    leaveB();
    rootA.remove();
    rootB.remove();
  });
});

describe("overlayStack — restauration", () => {
  it("restaure exactement l'état initial quand la pile se vide", () => {
    const app = appendChild();
    const root = appendChild({ overlayRoot: true });

    const leave = registerOverlay(root);
    leave();

    expect(app.getAttribute("aria-hidden")).toBeNull();
    expect(app.getAttribute("inert")).toBeNull();
    expect(overlayStackSize()).toBe(0);

    app.remove();
    root.remove();
  });

  it("préserve un aria-hidden posé par l'application", () => {
    const app = appendChild({ ariaHidden: "false" });
    const root = appendChild({ overlayRoot: true });

    const leave = registerOverlay(root);
    expect(app.getAttribute("aria-hidden")).toBe("true");

    leave();
    expect(app.getAttribute("aria-hidden")).toBe("false"); // valeur applicative rendue telle quelle
    expect(app.getAttribute("inert")).toBeNull();

    app.remove();
    root.remove();
  });

  it("isTopmostOverlay est faux hors pile et pour null", () => {
    const root = appendChild({ overlayRoot: true });

    expect(isTopmostOverlay(root)).toBe(false);
    expect(isTopmostOverlay(null)).toBe(false);

    root.remove();
  });
});
