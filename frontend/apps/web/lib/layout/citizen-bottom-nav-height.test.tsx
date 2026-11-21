// @vitest-environment jsdom

/**
 * BOTTOM-NAV-RESERVE-01 — la barre basse publie sa hauteur RÉELLE sur `<html>`
 * (`--citizen-bottom-nav-h`), consommée par la réserve des shells. Elle doit
 * revenir à zéro quand la barre disparaît, sans valeur périmée après une
 * navigation ou un changement de format.
 */

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_BOTTOM_NAV_HEIGHT_VAR } from "@/lib/layout/feed-mobile-refonte";

vi.mock("next/navigation", () => ({ usePathname: () => "/feed" }));
vi.mock("@/components/create-hub/create-hub-trigger-button", () => ({
  CreateHubTriggerButton: () => <button type="button">Créer</button>,
}));

/** Hauteur rendue de chaque barre, pilotée par le test (jsdom ne calcule aucune mise en page). */
const hauteurs = new WeakMap<Element, number>();
const observateurs = new Set<() => void>();

class FauxResizeObserver {
  private readonly rappel: () => void;
  constructor(rappel: () => void) {
    this.rappel = rappel;
  }
  observe() {
    observateurs.add(this.rappel);
  }
  disconnect() {
    observateurs.delete(this.rappel);
  }
  unobserve() {}
}

function barres(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>("nav.web-mobile-strategic-bottom-nav")];
}

function redimensionner(barre: HTMLElement, hauteur: number) {
  hauteurs.set(barre, hauteur);
  for (const rappel of [...observateurs]) rappel();
}

function valeur(): string {
  return document.documentElement.style.getPropertyValue(CITIZEN_BOTTOM_NAV_HEIGHT_VAR);
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", FauxResizeObserver);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const hauteur = hauteurs.get(this) ?? 0;
    return { height: hauteur, width: 390, top: 0, left: 0, right: 390, bottom: hauteur, x: 0, y: 0, toJSON: () => ({}) };
  });
});

afterEach(() => {
  cleanup();
  observateurs.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.documentElement.style.removeProperty(CITIZEN_BOTTOM_NAV_HEIGHT_VAR);
});

describe("hauteur publiée de la barre basse (BOTTOM-NAV-RESERVE-01)", () => {
  it("publie la hauteur rendue, puis 0 quand la barre est masquée", () => {
    render(<WebMobileStrategicBottomNav />);
    const [barre] = barres();
    redimensionner(barre!, 87);
    expect(valeur()).toBe("87px");

    // Palier ≥ 640 px ou parcours qui masque la barre : `display: none` → 0.
    redimensionner(barre!, 0);
    expect(valeur()).toBe("0px");
  });

  it("ne laisse aucune valeur après le démontage de la barre", () => {
    const { unmount } = render(<WebMobileStrategicBottomNav />);
    redimensionner(barres()[0]!, 53);
    unmount();
    expect(valeur()).toBe("");
  });

  it("garde la hauteur de la nouvelle barre quand l'ancienne est démontée après elle", () => {
    const ancienne = render(<WebMobileStrategicBottomNav />);
    redimensionner(barres()[0]!, 53);

    const nouvelle = render(<WebMobileStrategicBottomNav />);
    redimensionner(barres()[1]!, 87);
    expect(valeur()).toBe("87px");

    // Navigation : l'ancienne barre se démonte APRÈS le montage de la nouvelle.
    ancienne.unmount();
    expect(valeur()).toBe("87px");

    nouvelle.unmount();
    expect(valeur()).toBe("");
  });
});
