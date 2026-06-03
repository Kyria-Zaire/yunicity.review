"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  AdminActivationWaveDetail,
  AdminActivationWaveUpdatePayload,
} from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

function patchErrorMessage(err: unknown): string {
  if (isAuthError(err)) {
    return err.message;
  }
  return "La mise à jour n'a pas pu être enregistrée pour le moment.";
}

export function useAdminActivationWaveDetail(waveId: string | null) {
  const { adminActivationWavesApi } = useAuth();
  const [data, setData] = useState<AdminActivationWaveDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPatching, setIsPatching] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [patchSuccess, setPatchSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!waveId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const detail = await adminActivationWavesApi.getWaveDetail(waveId);
      setData(detail);
    } catch (err) {
      setData(null);
      if (isAuthError(err) && err.status === 404) {
        setError("Vague d'activation introuvable.");
      } else {
        setError(
          isAuthError(err)
            ? err.message
            : "Impossible de charger le détail de la vague pour le moment.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminActivationWavesApi, waveId]);

  useEffect(() => {
    void load();
  }, [load]);

  const clearPatchFeedback = useCallback(() => {
    setPatchError(null);
    setPatchSuccess(null);
  }, []);

  const updateItem = useCallback(
    async (
      itemId: string,
      payload: AdminActivationWaveUpdatePayload,
      successMessage = "Modifications enregistrées.",
    ): Promise<boolean> => {
      setIsPatching(true);
      setPatchError(null);
      setPatchSuccess(null);
      try {
        const updated = await adminActivationWavesApi.updateItem(itemId, payload);
        setData((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            items: prev.items.map((item) => (item.id === updated.id ? updated : item)),
          };
        });
        setPatchSuccess(successMessage);
        return true;
      } catch (err) {
        setPatchError(patchErrorMessage(err));
        return false;
      } finally {
        setIsPatching(false);
      }
    },
    [adminActivationWavesApi],
  );

  return {
    data,
    isLoading,
    error,
    reload: load,
    updateItem,
    isPatching,
    patchError,
    patchSuccess,
    clearPatchFeedback,
  };
}
