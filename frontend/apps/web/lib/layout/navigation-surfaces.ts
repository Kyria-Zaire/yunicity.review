/**
 * Contrats purs des surfaces stratégiques du chrome (C3.1-T3 / R4B).
 * Seuils alignés sur le chrome Feed : Desktop ≥1024 — aucun seuil d'acceptation (900/1366) ici.
 */
export const NAVIGATION_MOBILE_MAX_QUERY = "(max-width: 639.98px)";
export const NAVIGATION_DESKTOP_MIN_QUERY = "(min-width: 1024px)";
export const NAVIGATION_MOBILE_MAX_PX = 639.98;
export const NAVIGATION_DESKTOP_MIN_PX = 1024;

export type ExplorerSurface = "drawer" | "dialog";
export type YunicityMenuSurface = "drawer" | "sheet" | "popover";

export type NavigationSurfaceId = "explorer" | "menu" | "create";

export type NavigationSurfaceCloseReason =
  | "escape"
  | "outside-pointer"
  | "focus-exit"
  | "navigation"
  | "programmatic"
  | "superseded";

export type NavigationOverlayState = {
  activeSurface: NavigationSurfaceId | null;
  explorerSurface: ExplorerSurface | null;
  menuSurface: YunicityMenuSurface | null;
  lastCloseReason: NavigationSurfaceCloseReason | null;
  viewportWidth: number;
  /** False until the first client `set-viewport` — évite de traiter null→drawer/dialog comme un breakpoint. */
  surfacesInitialized: boolean;
};

/** État de départ SSR/hydratation : surfaces non résolues, viewport client inconnu. */
export function createInitialNavigationOverlayState(): NavigationOverlayState {
  return {
    activeSurface: null,
    lastCloseReason: null,
    viewportWidth: 0,
    explorerSurface: null,
    menuSurface: null,
    surfacesInitialized: false,
  };
}

/** Helper tests — simule l'état après la première résolution responsive client. */
export function createResolvedNavigationOverlayState(viewportWidth: number): NavigationOverlayState {
  return {
    activeSurface: null,
    lastCloseReason: null,
    viewportWidth,
    surfacesInitialized: true,
    ...resolveNavigationSurfacesFromWidth(viewportWidth),
  };
}

export function resolveExplorerSurface(width: number): ExplorerSurface {
  return width <= NAVIGATION_MOBILE_MAX_PX ? "drawer" : "dialog";
}

export function resolveYunicityMenuSurface(width: number): YunicityMenuSurface {
  if (width <= NAVIGATION_MOBILE_MAX_PX) return "drawer";
  if (width < NAVIGATION_DESKTOP_MIN_PX) return "sheet";
  return "popover";
}

export function resolveNavigationSurfacesFromWidth(width: number): Pick<
  NavigationOverlayState,
  "explorerSurface" | "menuSurface"
> {
  return {
    explorerSurface: resolveExplorerSurface(width),
    menuSurface: resolveYunicityMenuSurface(width),
  };
}

export function reduceNavigationOverlayState(
  state: NavigationOverlayState,
  action:
    | { type: "open"; id: NavigationSurfaceId }
    | { type: "close"; id: NavigationSurfaceId; reason: NavigationSurfaceCloseReason }
    | { type: "set-viewport"; width: number },
): NavigationOverlayState {
  if (action.type === "set-viewport") {
    const surfaces = resolveNavigationSurfacesFromWidth(action.width);

    if (!state.surfacesInitialized) {
      return {
        ...state,
        viewportWidth: action.width,
        ...surfaces,
        surfacesInitialized: true,
      };
    }

    const widthChanged = state.viewportWidth !== action.width;
    const surfaceKindChanged =
      widthChanged &&
      ((state.activeSurface === "explorer" &&
        state.explorerSurface !== surfaces.explorerSurface) ||
        (state.activeSurface === "menu" && state.menuSurface !== surfaces.menuSurface));

    return {
      ...state,
      viewportWidth: action.width,
      ...surfaces,
      activeSurface: surfaceKindChanged ? null : state.activeSurface,
      lastCloseReason: surfaceKindChanged ? "programmatic" : state.lastCloseReason,
    };
  }

  const surfaces = state.surfacesInitialized
    ? resolveNavigationSurfacesFromWidth(state.viewportWidth)
    : null;

  if (action.type === "open") {
    if (state.activeSurface === action.id) {
      return surfaces ? { ...state, ...surfaces, lastCloseReason: null } : { ...state, lastCloseReason: null };
    }
    return {
      ...state,
      ...(surfaces ?? {}),
      activeSurface: action.id,
      lastCloseReason: state.activeSurface ? "superseded" : null,
    };
  }

  if (state.activeSurface !== action.id) {
    return surfaces ? { ...state, ...surfaces } : state;
  }

  return {
    ...state,
    ...(surfaces ?? {}),
    activeSurface: null,
    lastCloseReason: action.reason,
  };
}

export function isNavigationSurfaceOpen(
  state: NavigationOverlayState,
  id: NavigationSurfaceId,
): boolean {
  return state.activeSurface === id;
}

export function shouldRestoreNavigationFocus(state: NavigationOverlayState): boolean {
  return state.lastCloseReason !== "superseded";
}
