"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { PassportMe, ProfileMe } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function usePassport() {
  const { yunicityApi, isAuthenticated } = useAuth();
  const [passport, setPassport] = useState<PassportMe | null>(null);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setPassport(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const profileData = await yunicityApi.getProfileMe();
      setProfile(profileData);
      setPassport(await yunicityApi.getPassportMeIfActive(profileData));
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger le passeport.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, yunicityApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activate = useCallback(async () => {
    setIsActivating(true);
    setError(null);
    try {
      const city = profile?.city?.trim() || undefined;
      setPassport(await yunicityApi.activatePassport(city ? { city } : {}));
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Activation impossible.");
    } finally {
      setIsActivating(false);
    }
  }, [yunicityApi, profile?.city]);

  return { passport, profile, error, isLoading, isActivating, reload, activate };
}
