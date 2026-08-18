import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { activeScrollLockCount, resetScrollLockForTests } from "./src/primitives/overlay/overlay-behavior";
import { POPOVER_ROOT_ATTRIBUTE } from "./src/primitives/popover/popover";
import {
  OVERLAY_ROOT_ATTRIBUTE,
  overlayStackSize,
  resetOverlayStackForTests,
} from "./src/primitives/overlay/overlay-stack";

// React 18 exige ce drapeau pour `act()` ; on le pose explicitement plutôt que de dépendre
// d'un effet de bord de la bibliothèque de test.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Aucune requête réseau dans les tests de primitives : un appel signale un bug, pas un test lent.
vi.stubGlobal("fetch", () => {
  throw new Error("Requête réseau interdite dans les tests de @yunicity/ui");
});

/**
 * Isolation stricte entre tests. Les invariants sont VÉRIFIÉS avant d'être réparés : une fuite
 * (verrou de scroll, `inert` résiduel, portail orphelin) doit faire échouer le test qui l'a
 * causée, pas contaminer le suivant en silence.
 */
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();

  const leaks: string[] = [];

  if (activeScrollLockCount() !== 0) {
    leaks.push(`verrou de scroll non libéré (compteur = ${activeScrollLockCount()})`);
  }
  if (overlayStackSize() !== 0) {
    leaks.push(`pile modale non vidée (${overlayStackSize()} overlay(s))`);
  }
  if (document.body.style.overflow !== "") {
    leaks.push(`document.body.style.overflow = "${document.body.style.overflow}"`);
  }

  const orphanRoots = document.querySelectorAll(`[${OVERLAY_ROOT_ATTRIBUTE}]`);
  if (orphanRoots.length > 0) {
    leaks.push(`${orphanRoots.length} racine(s) de portail orpheline(s)`);
  }
  const orphanPopovers = document.querySelectorAll(`[${POPOVER_ROOT_ATTRIBUTE}]`);
  if (orphanPopovers.length > 0) {
    leaks.push(`${orphanPopovers.length} racine(s) Popover orpheline(s)`);
  }
  const stillHidden = document.querySelectorAll("[inert], [aria-hidden='true']");
  if (stillHidden.length > 0) {
    leaks.push(`${stillHidden.length} élément(s) encore inert/aria-hidden`);
  }

  // Réparation inconditionnelle : l'état suivant doit être propre même si l'on lève ensuite.
  resetOverlayStackForTests();
  resetScrollLockForTests();
  document.body.style.overflow = "";
  orphanRoots.forEach((node) => node.remove());
  orphanPopovers.forEach((node) => node.remove());
  stillHidden.forEach((node) => {
    node.removeAttribute("inert");
    node.removeAttribute("aria-hidden");
  });
  document.body.replaceChildren();
  (document.activeElement as HTMLElement | null)?.blur?.();

  if (leaks.length > 0) {
    throw new Error(`État partagé entre tests détecté : ${leaks.join(" · ")}`);
  }
});
