"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { PassportStamp } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function usePassportStamps(enabled: boolean) {
  const { yunicityApi } = useAuth();
  const [stamps, setStamps] = useState<PassportStamp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await yunicityApi.listPassportStamps();
      setStamps(data.items);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger les tampons.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, yunicityApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { stamps, error, isLoading };
}
