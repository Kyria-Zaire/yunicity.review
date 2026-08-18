"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import {
  NAVIGATION_DESKTOP_MIN_QUERY,
  NAVIGATION_MOBILE_MAX_QUERY,
  createInitialNavigationOverlayState,
  isNavigationSurfaceOpen,
  reduceNavigationOverlayState,
  shouldRestoreNavigationFocus,
  type NavigationSurfaceCloseReason,
  type NavigationSurfaceId,
} from "@/lib/layout/navigation-surfaces";

export type NavigationOverlayCoordinatorValue = {
  activeSurface: NavigationSurfaceId | null;
  explorerSurface: ReturnType<typeof createInitialNavigationOverlayState>["explorerSurface"];
  menuSurface: ReturnType<typeof createInitialNavigationOverlayState>["menuSurface"];
  viewportWidth: number;
  surfacesInitialized: boolean;
  lastCloseReason: NavigationSurfaceCloseReason | null;
  openSurface: (id: NavigationSurfaceId) => void;
  closeSurface: (id: NavigationSurfaceId, reason: NavigationSurfaceCloseReason) => void;
  isSurfaceOpen: (id: NavigationSurfaceId) => boolean;
  shouldRestoreFocus: boolean;
};

export const NavigationOverlayCoordinatorContext =
  createContext<NavigationOverlayCoordinatorValue | null>(null);

export function NavigationOverlayCoordinatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    reduceNavigationOverlayState,
    undefined,
    () => createInitialNavigationOverlayState(),
  );

  useEffect(() => {
    const mobile = window.matchMedia(NAVIGATION_MOBILE_MAX_QUERY);
    const desktop = window.matchMedia(NAVIGATION_DESKTOP_MIN_QUERY);
    const updateViewport = () => {
      dispatch({ type: "set-viewport", width: window.innerWidth });
    };
    updateViewport();
    mobile.addEventListener("change", updateViewport);
    desktop.addEventListener("change", updateViewport);
    return () => {
      mobile.removeEventListener("change", updateViewport);
      desktop.removeEventListener("change", updateViewport);
    };
  }, []);

  const openSurface = useCallback((id: NavigationSurfaceId) => {
    dispatch({ type: "open", id });
  }, []);

  const closeSurface = useCallback((id: NavigationSurfaceId, reason: NavigationSurfaceCloseReason) => {
    dispatch({ type: "close", id, reason });
  }, []);

  const value = useMemo(
    (): NavigationOverlayCoordinatorValue => ({
      activeSurface: state.activeSurface,
      explorerSurface: state.explorerSurface,
      menuSurface: state.menuSurface,
      viewportWidth: state.viewportWidth,
      surfacesInitialized: state.surfacesInitialized,
      lastCloseReason: state.lastCloseReason,
      openSurface,
      closeSurface,
      isSurfaceOpen: (id) => isNavigationSurfaceOpen(state, id),
      shouldRestoreFocus: shouldRestoreNavigationFocus(state),
    }),
    [closeSurface, openSurface, state],
  );

  return (
    <NavigationOverlayCoordinatorContext.Provider value={value}>
      {children}
    </NavigationOverlayCoordinatorContext.Provider>
  );
}
