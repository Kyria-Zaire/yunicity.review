"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { CreateHubPortal } from "@/components/create-hub/create-hub-portal";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCreateHubVisibility } from "@/hooks/use-create-hub-visibility";

type CreateHubContextValue = {
  isOpen: boolean;
  openCreateHub: () => void;
  closeCreateHub: () => void;
};

const CreateHubContext = createContext<CreateHubContextValue | null>(null);

export function CreateHubProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const routeVisible = useCreateHubVisibility();
  const [isOpen, setIsOpen] = useState(false);

  const openCreateHub = useCallback(() => setIsOpen(true), []);
  const closeCreateHub = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!routeVisible) {
      setIsOpen(false);
    }
  }, [routeVisible]);

  const value = useMemo(
    (): CreateHubContextValue => ({
      isOpen,
      openCreateHub,
      closeCreateHub,
    }),
    [closeCreateHub, isOpen, openCreateHub],
  );

  const showChrome = isAuthenticated && !isLoading && routeVisible;

  return (
    <CreateHubContext.Provider value={value}>
      {children}
      {showChrome ? (
        <CreateHubPortal isOpen={isOpen} onClose={closeCreateHub} />
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

/** Hook optionnel — retourne null hors provider (tests). */
export function useCreateHubOptional(): CreateHubContextValue | null {
  return useContext(CreateHubContext);
}
