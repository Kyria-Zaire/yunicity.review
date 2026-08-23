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
import { useCreateHubAvailability } from "@/hooks/use-create-hub-visibility";
import { useAuth } from "@/lib/auth/auth-provider";
import type { CreateHubAction } from "@/lib/create-hub/create-hub-actions";
import { navigateFromCreateHub } from "@/lib/create-hub/create-hub-navigation";
import type { NavigationSurfaceCloseReason } from "@/lib/layout/navigation-surfaces";

type CreateHubContextValue = {
  isOpen: boolean;
  /**
   * `trigger` : declencheur a re-focaliser a la fermeture. Optionnel — les
   * appels sans element gardent le comportement historique.
   */
  openCreateHub: (trigger?: HTMLElement | null) => void;
  closeCreateHub: (reason?: NavigationSurfaceCloseReason) => void;
};

const CreateHubContext = createContext<CreateHubContextValue | null>(null);

export function CreateHubProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  /*
   * DISPONIBILITE de la route, pas visibilite d'une surface : le dialogue est
   * unique et partage. Sur `/videos`, seul le rail medium pose un declencheur —
   * si le provider se fiait a la surface par defaut, ce declencheur ouvrirait
   * le vide (C3-CITIZEN-MEDIUM-SHELL-R1E).
   */
  const routeVisible = useCreateHubAvailability();
  const surfaces = useNavigationSurfaces();

  const isOpen = surfaces.isSurfaceOpen("create");
  const restoreFocus = surfaces.shouldRestoreFocus;

  /*
   * C3-CITIZEN-MEDIUM-SHELL-R1D — cible EXPLICITE de retour du focus.
   *
   * Par defaut la surface memorise `document.activeElement` a l'ouverture. Or
   * WebKit ne focalise pas un `<button>` au clic : l'element memorise est alors
   * `body` et le focus n'est jamais rendu au declencheur (overlay-panel.tsx:57).
   * Le Create Hub n'avait jamais adopte l'echappatoire `returnFocusRef`, deja
   * en place pour l'Explorer et le Menu depuis C3-FEED-M2.3A/B.
   *
   * Le hub a plusieurs declencheurs (rail, top nav, bottom nav, sidebar) pour
   * un seul dialogue : c'est donc celui qui ouvre qui declare la cible.
   */
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const openCreateHub = useCallback(
    (trigger?: HTMLElement | null) => {
      if (trigger) returnFocusRef.current = trigger;
      surfaces.openSurface("create");
    },
    [surfaces],
  );

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
          returnFocusRef={returnFocusRef}
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
