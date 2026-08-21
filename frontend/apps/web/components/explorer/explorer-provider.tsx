"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, Drawer } from "@yunicity/ui/primitives";
import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";

import { ExplorerPanel } from "@/components/explorer/explorer-panel";
import { useExplorerCityState } from "@/hooks/use-explorer-city-state";
import { useNavigationSurfaces } from "@/hooks/use-navigation-surfaces";
import { isEditableShortcutTarget } from "@/lib/explorer/explorer-contract";
import { useAuth } from "@/lib/auth/auth-provider";
import type { NavigationSurfaceCloseReason } from "@/lib/layout/navigation-surfaces";

type ExplorerContextValue = {
  isOpen: boolean;
  openExplorer: () => void;
  closeExplorer: (reason?: NavigationSurfaceCloseReason) => void;
};

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export function ExplorerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const surfaces = useNavigationSurfaces();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listenerAttachedRef = useRef(false);

  const isOpen = surfaces.isSurfaceOpen("explorer");
  const surface = surfaces.explorerSurface;
  const cityState = useExplorerCityState({ enabled: isAuthenticated });

  const openExplorer = useCallback(() => {
    surfaces.openSurface("explorer");
  }, [surfaces]);

  const closeExplorer = useCallback(
    (reason: NavigationSurfaceCloseReason = "programmatic") => {
      surfaces.closeSurface("explorer", reason);
    },
    [surfaces],
  );

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    closeExplorer("navigation");
  }, [pathname, closeExplorer]);

  const explorerSurfaceRef = useRef<typeof surface>(null);
  useEffect(() => {
    if (!surfaces.surfacesInitialized || surface === null) return;
    if (explorerSurfaceRef.current === null) {
      explorerSurfaceRef.current = surface;
      return;
    }
    if (explorerSurfaceRef.current === surface) return;
    explorerSurfaceRef.current = surface;
    if (isOpen) {
      closeExplorer("programmatic");
    }
  }, [closeExplorer, isOpen, surface, surfaces.surfacesInitialized]);

  useEffect(() => {
    if (listenerAttachedRef.current) return;
    listenerAttachedRef.current = true;

    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      if (isEditableShortcutTarget(event.target)) return;
      event.preventDefault();
      surfaces.openSurface("explorer");
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      listenerAttachedRef.current = false;
    };
  }, [surfaces]);

  const handleNavigate = useCallback(
    (path: string) => {
      closeExplorer("navigation");
      router.push(path);
    },
    [closeExplorer, router],
  );

  const restoreFocus = surfaces.shouldRestoreFocus;

  const value = useMemo(
    (): ExplorerContextValue => ({
      isOpen,
      openExplorer,
      closeExplorer,
    }),
    [closeExplorer, isOpen, openExplorer],
  );

  const panel = (
    <ExplorerPanel
      query={query}
      onQueryChange={setQuery}
      cityState={isAuthenticated ? cityState : null}
      inputRef={inputRef}
      onNavigate={handleNavigate}
    />
  );

  return (
    <ExplorerContext.Provider value={value}>
      {children}
      {surface === "drawer" ? (
        <Drawer
          open={isOpen}
          onOpenChange={(next) => {
            if (!next) closeExplorer("escape");
          }}
          title="Explorer Reims"
          initialFocusRef={inputRef}
          restoreFocus={restoreFocus}
          zIndex={NAVIGATION_MODAL_Z_INDEX}
        >
          {panel}
        </Drawer>
      ) : surface === "dialog" ? (
        <Dialog
          open={isOpen}
          onOpenChange={(next) => {
            if (!next) closeExplorer("escape");
          }}
          title="Explorer Reims"
          initialFocusRef={inputRef}
          restoreFocus={restoreFocus}
        >
          {panel}
        </Dialog>
      ) : null}
    </ExplorerContext.Provider>
  );
}

export function useExplorer(): ExplorerContextValue {
  const context = useContext(ExplorerContext);
  if (!context) {
    throw new Error("useExplorer doit être utilisé dans ExplorerProvider");
  }
  return context;
}

export function useExplorerOptional(): ExplorerContextValue | null {
  return useContext(ExplorerContext);
}
