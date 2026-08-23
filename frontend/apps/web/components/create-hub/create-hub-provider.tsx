"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "@yunicity/ui/primitives";
import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";

import {
  CreateHubDialogContent,
  CREATE_HUB_DIALOG_TITLE,
} from "@/components/create-hub/create-hub-dialog";
import { useNavigationSurfaces } from "@/hooks/use-navigation-surfaces";
import { useCreateHubVisibility } from "@/hooks/use-create-hub-visibility";
import { useAuth } from "@/lib/auth/auth-provider";
import type { CreateHubAction } from "@/lib/create-hub/create-hub-actions";
import { navigateFromCreateHub } from "@/lib/create-hub/create-hub-navigation";
import type { NavigationSurfaceCloseReason } from "@/lib/layout/navigation-surfaces";

type CreateHubContextValue = {
  isOpen: boolean;
  openCreateHub: () => void;
  closeCreateHub: (reason?: NavigationSurfaceCloseReason) => void;
};

const CreateHubContext = createContext<CreateHubContextValue | null>(null);

export function CreateHubProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const routeVisible = useCreateHubVisibility();
  const surfaces = useNavigationSurfaces();

  const isOpen = surfaces.isSurfaceOpen("create");
  const restoreFocus = surfaces.shouldRestoreFocus;

  const openCreateHub = useCallback(() => {
    surfaces.openSurface("create");
  }, [surfaces]);

  const closeCreateHub = useCallback(
    (reason: NavigationSurfaceCloseReason = "programmatic") => {
      surfaces.closeSurface("create", reason);
    },
    [surfaces],
  );

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    closeCreateHub("navigation");
  }, [closeCreateHub, pathname]);

  useEffect(() => {
    if (!routeVisible && isOpen) {
      closeCreateHub("programmatic");
    }
  }, [closeCreateHub, isOpen, routeVisible]);

  const handleSelect = useCallback(
    (action: CreateHubAction) => {
      closeCreateHub("navigation");
      navigateFromCreateHub(action.href, { pathname, router });
    },
    [closeCreateHub, pathname, router],
  );

  const value = useMemo(
    (): CreateHubContextValue => ({
      isOpen,
      openCreateHub,
      closeCreateHub,
    }),
    [closeCreateHub, isOpen, openCreateHub],
  );

  const showDialog = routeVisible;

  return (
    <CreateHubContext.Provider value={value}>
      {children}
      {showDialog ? (
        <Dialog
          open={isOpen}
          onOpenChange={(next) => {
            if (!next) closeCreateHub("escape");
          }}
          title={CREATE_HUB_DIALOG_TITLE}
          restoreFocus={restoreFocus}
          zIndex={NAVIGATION_MODAL_Z_INDEX}
        >
          <CreateHubDialogContent
            isAuthenticated={isAuthenticated}
            onSelect={handleSelect}
            onClose={() => closeCreateHub("programmatic")}
          />
        </Dialog>
      ) : null}
    </CreateHubContext.Provider>
  );
}

export function useCreateHub(): CreateHubContextValue {
  const context = useContext(CreateHubContext);
  if (!context) {
    throw new Error("useCreateHub doit être utilisé dans CreateHubProvider");
  }
  return context;
}

export function useCreateHubOptional(): CreateHubContextValue | null {
  return useContext(CreateHubContext);
}
