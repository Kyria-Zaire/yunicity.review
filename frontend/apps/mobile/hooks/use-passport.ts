import { useAuth } from "@/lib/auth-provider";
import type { PassportMe, ProfileMe } from "@yunicity/types";
import { isAuthError, isPassportNotActiveError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function usePassport() {
  const { yunicityApi } = useAuth();
  const [passport, setPassport] = useState<PassportMe | null>(null);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [justActivated, setJustActivated] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profileData = await yunicityApi.getProfileMe();
      setProfile(profileData);
      try {
        const passportData = await yunicityApi.getPassportMe();
        setPassport(passportData);
      } catch (err) {
        if (isPassportNotActiveError(err) || (isAuthError(err) && err.status === 404)) {
          setPassport(null);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger le passeport.");
    } finally {
      setIsLoading(false);
    }
  }, [yunicityApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activate = useCallback(async () => {
    setIsActivating(true);
    setError(null);
    setJustActivated(false);
    try {
      const city = profile?.city?.trim() || undefined;
      const activated = await yunicityApi.activatePassport(city ? { city } : {});
      setPassport(activated);
      setJustActivated(true);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Activation impossible.");
    } finally {
      setIsActivating(false);
    }
  }, [yunicityApi, profile?.city]);

  return {
    passport,
    profile,
    error,
    isLoading,
    isActivating,
    justActivated,
    reload,
    activate,
    clearJustActivated: () => setJustActivated(false),
  };
}
