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
  isAuthError,
  isPassportNotActiveError,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

export function usePassportMe() {
  const { yunicityApi, isAuthenticated } = useAuth();
  const [overview, setOverview] = useState<PassportOverviewResponse | null>(null);
  const [badges, setBadges] = useState<PassportBadgesResponse | null>(null);
  const [challenges, setChallenges] = useState<PassportChallengesResponse | null>(null);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsActivation, setNeedsActivation] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [claimingCode, setClaimingCode] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<ChallengeClaimResponse | null>(null);

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
    if (!isAuthenticated) {
      setOverview(null);
      setBadges(null);
      setChallenges(null);
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
        if (isPassportNotActiveError(err) || (isAuthError(err) && err.status === 404)) {
          setOverview(null);
          setBadges(null);
          setChallenges(null);
          setNeedsActivation(true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger votre Passport.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadPassportData, yunicityApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activate = useCallback(async () => {
    setIsActivating(true);
    setError(null);
    try {
      const city = profile?.city?.trim() || undefined;
      await yunicityApi.activatePassport(city ? { city } : {});
      await loadPassportData();
      setNeedsActivation(false);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Activation impossible.");
    } finally {
      setIsActivating(false);
    }
  }, [loadPassportData, profile?.city, yunicityApi]);

  const claimReward = useCallback(
    async (challengeCode: string) => {
      setClaimingCode(challengeCode);
      setClaimError(null);
      setClaimSuccess(null);
      try {
        const result = await yunicityApi.claimChallengeReward(challengeCode);
        setClaimSuccess(result);
        await loadPassportData();
      } catch (err) {
        setClaimError(
          humanizeChallengeClaimError(err, "Impossible de réclamer cette récompense."),
        );
      } finally {
        setClaimingCode(null);
      }
    },
    [loadPassportData, yunicityApi],
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
