"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminPartnerDetailResponse } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function useAdminPartnerDetail(organizationId: string) {
  const { adminPartnersApi } = useAuth();
  const [data, setData] = useState<AdminPartnerDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!organizationId.trim()) {
      setData(null);
      setIsNotFound(true);
      setError("Identifiant organisation invalide.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    try {
      const response = await adminPartnersApi.getPartnerDetail(organizationId);
      setData(response);
    } catch (err) {
      setData(null);
      if (isAuthError(err) && err.status === 404 && err.code === "ORGANIZATION_NOT_FOUND") {
        setIsNotFound(true);
        setError("Organisation introuvable.");
      } else {
        setIsNotFound(false);
        setError(
          isAuthError(err)
            ? err.message
            : "Impossible de charger la fiche partenaire pour le moment.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminPartnersApi, organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    isLoading,
    error,
    isNotFound,
    reload: load,
  };
}
