/**
 * VIDEO-REFONTE-L8 — navigation lecteur desktop (R-ORD, R-VIDE, R-FOCUS).
 * Logique pure, testable hors React / historique navigateur.
 */

export const DESKTOP_OVERLAY_RVIDE_PAGE_BUDGET = 3;

export const DESKTOP_OVERLAY_LABELS = {
  loadingVideo: "Chargement de la vidéo…",
  loadingNext: "Chargement des vidéos suivantes…",
  loadMoreFailed: "Impossible de charger la suite",
  retry: "Réessayer",
  continueSearch: "Continuer à chercher",
  noMoreForNow: "Aucun résultat supplémentaire trouvé pour le moment",
  endOfList: "Aucune autre vidéo pour ces filtres",
  seeFeedVideos: "Voir les vidéos du fil",
  closePlayer: "Fermer le lecteur",
  previous: "Vidéo précédente",
  next: "Vidéo suivante",
  dialogLabel: "Lecteur vidéo",
} as const;

/** Marqueur d'ouverture depuis une vignette (D1 / fermeture). */
export const DESKTOP_OVERLAY_OPEN_FROM_GRID_KEY = "yunicity.videos.desktopOverlay.openFromGrid";
export const DESKTOP_OVERLAY_OPEN_SCROLL_KEY = "yunicity.videos.desktopOverlay.openScrollY";

export type OverlayOpenOrigin = "grid" | "direct";

export type RVideStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "continue"; /** next_cursor encore présent */ }
  | { kind: "exhausted" };

/**
 * R-ORD §1 — séquence figée à l'ouverture.
 * Direct hors grille (D5) : `[focusId, …grille sans doublon]`.
 * Sinon : copie de la grille ; si focus absent, on le préfixe (lien partagé).
 */
export function createTraversalSequence(
  gridIds: readonly string[],
  focusId: string,
  options?: { directOutsideGrid?: boolean },
): string[] {
  const seen = new Set<string>();
  const sequence: string[] = [];

  const push = (id: string) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    sequence.push(id);
  };

  const inGrid = gridIds.includes(focusId);
  const directOutside = options?.directOutsideGrid ?? !inGrid;

  if (directOutside || !inGrid) {
    push(focusId);
  }

  for (const id of gridIds) {
    push(id);
  }

  if (!sequence.includes(focusId)) {
    sequence.unshift(focusId);
  }

  return sequence;
}

/**
 * R-ORD §3 — après chargement : dédoublonnage, ajout **en fin** uniquement.
 * `pageIds` est déjà filtré/trié entre les nouvelles vidéos par l'appelant.
 */
export function appendPageToSequence(
  sequence: readonly string[],
  pageIds: readonly string[],
): string[] {
  const seen = new Set(sequence);
  const next = [...sequence];
  for (const id of pageIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

export function indexInSequence(sequence: readonly string[], videoId: string): number {
  return sequence.indexOf(videoId);
}

/**
 * R-VIDE — résultat d'un cycle « au plus N pages » sans ajout utile.
 */
export function resolveRVideAfterEmptyCycle(args: {
  pagesAttempted: number;
  addedCount: number;
  hasMore: boolean;
}): RVideStatus {
  if (args.addedCount > 0) return { kind: "idle" };
  if (!args.hasMore) return { kind: "exhausted" };
  if (args.pagesAttempted >= DESKTOP_OVERLAY_RVIDE_PAGE_BUDGET) {
    return { kind: "continue" };
  }
  return { kind: "idle" };
}

/**
 * R-FOCUS — cible de focus à la fermeture, par priorité PRD §5.5.
 */
export type GridRestoreTarget =
  | { kind: "tile"; videoId: string }
  | { kind: "gridTitle" };

export function resolveGridRestoreTarget(args: {
  lastViewedVideoId: string | null;
  openingVideoId: string | null;
  gridIds: readonly string[];
}): GridRestoreTarget {
  if (args.lastViewedVideoId && args.gridIds.includes(args.lastViewedVideoId)) {
    return { kind: "tile", videoId: args.lastViewedVideoId };
  }
  if (args.openingVideoId && args.gridIds.includes(args.openingVideoId)) {
    return { kind: "tile", videoId: args.openingVideoId };
  }
  return { kind: "gridTitle" };
}

/** Sticky session : survit aux remounts (Avance navigateur) jusqu'à fermeture réelle. */
let stickyOverlayOrigin: OverlayOpenOrigin | null = null;
let stickyOverlayScrollY: number | null = null;
/**
 * Scroll capturé au pointerdown — avant que le focus du lien ne recentre une vignette
 * partiellement hors cadre (cause mesurée Δ11 : p1Top=-11 → scroll 217→206).
 */
let pendingOverlayOpenScrollY: number | null = null;

/** À appeler en `pointerdown`/`mousedown` sur la vignette, avant le focus navigateur. */
export function captureOverlayOpenScrollY(): void {
  // Ne pas écraser une capture déjà prise (2e mousedown après recentrage focus).
  if (pendingOverlayOpenScrollY != null) return;
  pendingOverlayOpenScrollY = window.scrollY;
}

export function markOverlayOpenFromGrid(videoId: string): void {
  // pending (mousedown) > sticky déjà posé (ne pas écraser après focus/Playwright) > window.
  const scrollY = pendingOverlayOpenScrollY ?? stickyOverlayScrollY ?? window.scrollY;
  pendingOverlayOpenScrollY = null;
  clearOverlayOpenSession();
  try {
    sessionStorage.setItem(DESKTOP_OVERLAY_OPEN_FROM_GRID_KEY, videoId);
    // Avant push Link : mémoriser le scroll (le routeur peut sinon remonter la page).
    sessionStorage.setItem(DESKTOP_OVERLAY_OPEN_SCROLL_KEY, String(scrollY));
  } catch {
    /* private mode */
  }
  stickyOverlayOrigin = "grid";
  stickyOverlayScrollY = scrollY;
}

export function consumeOverlayOpenOrigin(focusVideoId: string): OverlayOpenOrigin {
  try {
    const marked = sessionStorage.getItem(DESKTOP_OVERLAY_OPEN_FROM_GRID_KEY);
    if (marked === focusVideoId) {
      sessionStorage.removeItem(DESKTOP_OVERLAY_OPEN_FROM_GRID_KEY);
      stickyOverlayOrigin = "grid";
      return "grid";
    }
  } catch {
    /* private mode */
  }
  if (stickyOverlayOrigin) return stickyOverlayOrigin;
  stickyOverlayOrigin = "direct";
  return "direct";
}

export function consumeOverlayOpenScrollY(): number | null {
  try {
    const raw = sessionStorage.getItem(DESKTOP_OVERLAY_OPEN_SCROLL_KEY);
    if (raw != null) {
      sessionStorage.removeItem(DESKTOP_OVERLAY_OPEN_SCROLL_KEY);
      const value = Number(raw);
      if (Number.isFinite(value)) {
        stickyOverlayScrollY = value;
        return value;
      }
    }
  } catch {
    /* private mode */
  }
  return stickyOverlayScrollY;
}

/** À appeler à la fermeture réelle du lecteur (pas au remount Strict / Avance). */
export function clearOverlayOpenSession(): void {
  stickyOverlayOrigin = null;
  stickyOverlayScrollY = null;
  pendingOverlayOpenScrollY = null;
  try {
    sessionStorage.removeItem(DESKTOP_OVERLAY_OPEN_FROM_GRID_KEY);
    sessionStorage.removeItem(DESKTOP_OVERLAY_OPEN_SCROLL_KEY);
  } catch {
    /* private mode */
  }
}

/** Ne pas intercepter ↑↓ pendant saisie ou dans un panneau qui les utilise. */
export function shouldIgnoreOverlayArrowKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest('[role="listbox"], [role="menu"], [role="textbox"], [data-overlay-arrow-nav="ignore"]')) {
    return true;
  }
  return false;
}

export const DESKTOP_OVERLAY_GRID_TITLE_SELECTOR = "[data-videos-desktop-grid-title]";

export function desktopOverlayTileSelector(videoId: string): string {
  const safe = videoId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `[data-videos-desktop-grid-tile][data-video-id="${safe}"] a`;
}
