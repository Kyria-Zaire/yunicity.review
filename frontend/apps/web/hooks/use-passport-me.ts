"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type {
  ChallengeClaimResponse,
  PassportBadgesResponse,
  PassportChallengesResponse,
  PassportOverviewResponse,
  ProfileMe,
} from "@yunicity/types";
import {
  humanizeChallengeClaimError,
  humanizePassportMeLoadError,
  isPassportNotActiveError,
  isSessionExpiredAuthError,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function usePassportMe() {
  const { yunicityApi, isAuthenticated, user } = useAuth();
  const [overview, setOverview] = useState<PassportOverviewResponse | null>(null);
  const [badges, setBadges] = useState<PassportBadgesResponse | null>(null);
  const [challenges, setChallenges] = useState<PassportChallengesResponse | null>(null);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsActivation, setNeedsActivation] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [claimingCode, setClaimingCode] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<ChallengeClaimResponse | null>(null);

  const clearPassportData = useCallback(() => {
    setOverview(null);
    setBadges(null);
    setChallenges(null);
    setNeedsActivation(false);
  }, []);

  const handleSessionExpired = useCallback(() => {
    clearPassportData();
    setError(null);
    setClaimError(null);
    setClaimSuccess(null);
    setIsSessionExpired(true);
  }, [clearPassportData]);

  const handleAuthError = useCallback(
    (err: unknown): boolean => {
      if (!isSessionExpiredAuthError(err)) {
        return false;
      }
      handleSessionExpired();
      return true;
    },
    [handleSessionExpired],
  );

  const loadPassportData = useCallback(async () => {
    const [overviewData, badgesData, challengesData] = await Promise.all([
      yunicityApi.getMyPassport(),
      yunicityApi.getMyPassportBadges(),
      yunicityApi.getMyPassportChallenges(),
    ]);
    setOverview(overviewData);
    setBadges(badgesData);
    setChallenges(challengesData);
    setNeedsActivation(false);
  }, [yunicityApi]);

  const reload = useCallback(async () => {
    if (!isAuthenticated || isSessionExpired) {
      clearPassportData();
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const profileData = await yunicityApi.getProfileMe();
      setProfile(profileData);
      try {
        await loadPassportData();
      } catch (err) {
        if (handleAuthError(err)) {
          return;
        }
        if (isPassportNotActiveError(err)) {
          clearPassportData();
          setNeedsActivation(true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      setError(humanizePassportMeLoadError(err, "Impossible de charger votre Passport."));
    } finally {
      setIsLoading(false);
    }
  }, [
    clearPassportData,
    handleAuthError,
    isAuthenticated,
    isSessionExpired,
    loadPassportData,
    yunicityApi,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsSessionExpired(false);
    void reload();
  }, [isAuthenticated, reload]);

  const activate = useCallback(async () => {
    if (isSessionExpired) {
      return;
    }
    setIsActivating(true);
    setError(null);
    const city = profile?.city?.trim() || user?.city?.trim() || undefined;
    try {
      await yunicityApi.activatePassport(city ? { city } : {});
      try {
        await loadPassportData();
        setNeedsActivation(false);
      } catch (loadErr) {
        if (handleAuthError(loadErr)) {
          return;
        }
        setError(
          humanizePassportMeLoadError(
            loadErr,
            "Passport activé, mais l'affichage V2 est momentanément indisponible.",
          ),
        );
      }
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      setError(humanizePassportMeLoadError(err, "Activation impossible."));
    } finally {
      setIsActivating(false);
    }
  }, [
    handleAuthError,
    isSessionExpired,
    loadPassportData,
    profile?.city,
    user?.city,
    yunicityApi,
  ]);

  const claimReward = useCallback(
    async (challengeCode: string) => {
      if (isSessionExpired) {
        return;
      }
      setClaimingCode(challengeCode);
      setClaimError(null);
      setClaimSuccess(null);
      try {
        const result = await yunicityApi.claimChallengeReward(challengeCode);
        setClaimSuccess(result);
        await loadPassportData();
      } catch (err) {
        if (handleAuthError(err)) {
          return;
        }
        setClaimError(
          humanizeChallengeClaimError(err, "Impossible de réclamer cette récompense."),
        );
      } finally {
        setClaimingCode(null);
      }
    },
    [handleAuthError, isSessionExpired, loadPassportData, yunicityApi],
  );

  const clearClaimFeedback = useCallback(() => {
    setClaimError(null);
    setClaimSuccess(null);
  }, []);

  return {
    overview,
    badges,
    challenges,
    profile,
    error,
    isLoading,
    needsActivation,
    isSessionExpired,
    isActivating,
    claimingCode,
    claimError,
    claimSuccess,
    reload,
    activate,
    claimReward,
    clearClaimFeedback,
  };
}
