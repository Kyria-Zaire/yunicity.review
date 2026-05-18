"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { UserProfile } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function useProfileMe() {
  const { yunicityApi, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await yunicityApi.getProfileMe();
      setProfile(data);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger le profil.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, yunicityApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { profile, error, isLoading, reload };
}
