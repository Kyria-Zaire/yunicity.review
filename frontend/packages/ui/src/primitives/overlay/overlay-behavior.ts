/**
 * Logique PURE des overlays (C3.0-T3) — aucun accès DOM, aucun React.
 *
 * Tout ce qui est délicat dans un overlay (piège de focus, politique de fermeture,
 * verrou de scroll imbriqué, émission unique de `onOpenChange`) vit ici et se teste
 * sans navigateur. `overlay-panel.tsx` n'en est que l'adaptateur DOM.
 *
 * Sélecteur repris de `apps/web/components/map/map-context-drawer.tsx` (implémentation
 * de référence, éprouvée sur la carte) — la carte n'est PAS modifiée par ce ticket.
 */
export const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type OverlaySide = "left" | "right" | "bottom";

/** Raison de fermeture — sert à appliquer la politique `dismissible`. */
export type OverlayCloseReason = "close-button" | "escape" | "overlay-click";

/**
 * `dismissible: false` = fermeture par geste implicite refusée (Escape, clic sur l'overlay).
 * Le bouton Close reste TOUJOURS actif : un overlay sans sortie explicite est un piège.
 */
export function canCloseOverlay(dismissible: boolean, reason: OverlayCloseReason): boolean {
  return reason === "close-button" || dismissible;
}

export type TabTrapInput = {
  focusableCount: number;
  /** Index de l'élément actif dans le panneau, `-1` si le focus est en dehors. */
  activeIndex: number;
  shiftKey: boolean;
};

export type TabTrapDecision = {
  preventDefault: boolean;
  /** Index à focaliser, `null` si la navigation native doit suivre son cours. */
  focusIndex: number | null;
};

/** Piège de focus : renvoie la décision à appliquer sur `Tab` / `Shift+Tab`. */
export function resolveTabTrap({ focusableCount, activeIndex, shiftKey }: TabTrapInput): TabTrapDecision {
  if (focusableCount <= 0) {
    return { preventDefault: true, focusIndex: null };
  }
  if (activeIndex < 0) {
    return { preventDefault: true, focusIndex: 0 };
  }
  if (shiftKey && activeIndex === 0) {
    return { preventDefault: true, focusIndex: focusableCount - 1 };
  }
  if (!shiftKey && activeIndex === focusableCount - 1) {
    return { preventDefault: true, focusIndex: 0 };
  }
  return { preventDefault: false, focusIndex: null };
}

/** Transformée de fermeture selon le côté — l'ouverture est toujours `translate(0)`. */
export function closedTransform(side: OverlaySide): string {
  if (side === "left") return "translateX(-100%)";
  if (side === "right") return "translateX(100%)";
  return "translateY(100%)";
}

export function panelPositionClass(side: OverlaySide): string {
  if (side === "left") return "inset-y-0 left-0 h-full w-[min(400px,88vw)] rounded-r-yunicity-xl";
  if (side === "right") return "inset-y-0 right-0 h-full w-[min(400px,88vw)] rounded-l-yunicity-xl";
  // Safe-area iOS : aucun token n'exprime `env()`, valeur fonctionnelle assumée en classe
  // (et non en style inline) pour rester vérifiable et générée par Tailwind.
  return "inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-yunicity-2xl pb-[max(1rem,env(safe-area-inset-bottom))]";
}

/* ------------------------------- verrou scroll ------------------------------ */

/** Contrat minimal satisfait par `HTMLElement` — et par un double de test. */
export type ScrollLockTarget = { style: { overflow: string } };

let activeLocks = 0;
let restoreOverflow = "";

/**
 * Verrou de scroll à COMPTEUR : deux overlays superposés ne doivent pas se déverrouiller
 * mutuellement. Renvoie la fonction de libération (idempotente).
 */
export function acquireScrollLock(target: ScrollLockTarget | null): () => void {
  if (!target) return () => undefined;

  if (activeLocks === 0) {
    restoreOverflow = target.style.overflow;
    target.style.overflow = "hidden";
  }
  activeLocks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeLocks -= 1;
    if (activeLocks <= 0) {
      activeLocks = 0;
      target.style.overflow = restoreOverflow;
    }
  };
}

/** Exposé pour les tests — jamais utilisé par les composants. */
export function activeScrollLockCount(): number {
  return activeLocks;
}

/** Réinitialisation de secours entre tests (garde d'isolation). Jamais appelée en production. */
export function resetScrollLockForTests(): void {
  activeLocks = 0;
  restoreOverflow = "";
}
