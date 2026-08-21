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

export type OverlaySide = "left" | "right" | "bottom" | "center";

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

/** Transformée de fermeture selon le côté — l'ouverture est `enteredTransform(side)`. */
export function closedTransform(side: OverlaySide): string {
  if (side === "left") return "translateX(-100%)";
  if (side === "right") return "translateX(100%)";
  if (side === "center") return "translateY(0.5rem) scale(0.96)";
  return "translateY(100%)";
}

export function enteredTransform(side: OverlaySide): string {
  return side === "center" ? "translateY(0) scale(1)" : "translate(0, 0)";
}

export function panelPositionClass(side: OverlaySide): string {
  if (side === "left") return "inset-y-0 left-0 h-full w-[min(400px,88vw)] rounded-r-yunicity-xl";
  if (side === "right") return "inset-y-0 right-0 h-full w-[min(400px,88vw)] rounded-l-yunicity-xl";
  if (side === "center") {
    return "relative w-full max-w-[min(32rem,92vw)] max-h-[min(85dvh,100%)] rounded-yunicity-2xl";
  }
  // Safe-area iOS : aucun token n'exprime `env()`, valeur fonctionnelle assumée en classe
  // (et non en style inline) pour rester vérifiable et générée par Tailwind.
  return "inset-x-0 bottom-0 flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-yunicity-2xl pb-[max(1rem,env(safe-area-inset-bottom))]";
}

/** Conteneur racine du portail — centre le Dialog sans translate(-50%, -50%). */
export function overlayContainerClass(side: OverlaySide): string {
  if (side === "center") {
    return "flex items-center justify-center p-4";
  }
  return "";
}

/* ----------------------------- readiness d'entrée --------------------------- */

/**
 * Phase d'entrée exposée au DOM (C3.1-R1E).
 *
 * `entering` tant que le panneau translate encore : sa géométrie n'est PAS celle de
 * l'état ouvert. Mesurer ou cliquer pendant cette phase donne un résultat dépendant
 * de la frame d'animation. `entered` = position finale atteinte.
 *
 * Purement informatif : aucun comportement (focus, Escape, inertie, fermeture) n'en
 * dépend. Un consommateur qui l'ignore obtient exactement le comportement antérieur.
 */
export type OverlayPhase = "entering" | "entered";

export function overlayPhase(settled: boolean): OverlayPhase {
  return settled ? "entered" : "entering";
}

/**
 * Durée de transition la plus longue déclarée, en millisecondes.
 *
 * `transition-duration` peut lister plusieurs valeurs ("0.2s, 0.3s"). Une valeur
 * absente, nulle ou illisible vaut 0 : sans transition, `transitionend` ne sera
 * jamais émis et la readiness doit être acquise immédiatement plutôt que bloquée
 * (cas `prefers-reduced-motion`, et jsdom qui ne calcule aucun style Tailwind).
 */
export function longestTransitionMs(durations: string): number {
  return durations
    .split(",")
    .reduce((longest, raw) => Math.max(longest, parseDurationMs(raw.trim())), 0);
}

function parseDurationMs(value: string): number {
  const match = /^(-?[\d.]+)(ms|s)$/.exec(value);
  if (!match) return 0;
  const amount = Number.parseFloat(match[1] as string);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return match[2] === "s" ? amount * 1000 : amount;
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
