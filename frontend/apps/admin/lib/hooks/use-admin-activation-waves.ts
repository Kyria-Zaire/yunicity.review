"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminActivationWaveListItem } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function useAdminActivationWaves() {
  const { adminActivationWavesApi } = useAuth();
  const [waves, setWaves] = useState<AdminActivationWaveListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await adminActivationWavesApi.listWaves();
      setWaves(list);
    } catch (err) {
      setWaves([]);
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les vagues d'activation pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminActivationWavesApi]);

  useEffect(() => {
    void load();
  }, [load]);

  return { waves, isLoading, error, reload: load };
}
