"use client";

import type { AdminPlatformConfigSnapshot } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";

export function useAdminPlatformConfig() {
  const { adminPlatformConfigApi } = useAuth();
  const [snapshot, setSnapshot] = useState<AdminPlatformConfigSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminPlatformConfigApi.getSnapshot();
      setSnapshot(data);
    } catch (err) {
      setSnapshot(null);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger la configuration plateforme.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminPlatformConfigApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    snapshot,
    isLoading,
    error,
    reload,
  };
}
