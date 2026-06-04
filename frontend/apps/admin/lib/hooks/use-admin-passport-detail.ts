"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminPassportDetailResponse } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function useAdminPassportDetail(passportId: string) {
  const { adminPassportsApi } = useAuth();
  const [data, setData] = useState<AdminPassportDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!passportId.trim()) {
      setData(null);
      setIsNotFound(true);
      setError("Identifiant passport invalide.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    try {
      const response = await adminPassportsApi.getPassportDetail(passportId);
      setData(response);
    } catch (err) {
      setData(null);
      if (isAuthError(err) && err.status === 404 && err.code === "PASSPORT_NOT_FOUND") {
        setIsNotFound(true);
        setError("Passport introuvable.");
      } else {
        setIsNotFound(false);
        setError(
          isAuthError(err)
            ? err.message
            : "Impossible de charger la fiche passport pour le moment.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminPassportsApi, passportId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, isNotFound, reload: load };
}
