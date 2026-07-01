"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { filterPartnerPortalOrganizations } from "@yunicity/utils";
import { useEffect, useState } from "react";

/**
 * Indique si l'utilisateur peut voir « Animer un lieu » dans le Create Hub.
 * Lecture légère de listMyOrganizations — pas de PartnerPortalProvider requis.
 */
export function useCreateHubPartnerAccess(): { showPartnerAction: boolean; isLoading: boolean } {
  const { isAuthenticated, yunicityApi } = useAuth();
  const [showPartnerAction, setShowPartnerAction] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowPartnerAction(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void yunicityApi
      .listMyOrganizations()
      .then((response) => {
        if (cancelled) return;
        setShowPartnerAction(filterPartnerPortalOrganizations(response.items).length > 0);
      })
      .catch(() => {
        if (!cancelled) {
          setShowPartnerAction(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, yunicityApi]);

  return { showPartnerAction, isLoading };
}
