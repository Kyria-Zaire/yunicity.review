"use client";

import type { PassportChallengesResponse, PassportOverviewResponse } from "@yunicity/types";
import { useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

/**
 * Données Passport pour le rail feed desktop — overview + défis actifs.
 * Deux routes canoniques existantes, montées uniquement après activation lazy.
 */
export function usePassportFeedRail(enabled = false): {
  overview: PassportOverviewResponse | null;
  challenges: PassportChallengesResponse | null;
  loading: boolean;
  error: boolean;
} {
  const api = useYunicityApi();
  const [overview, setOverview] = useState<PassportOverviewResponse | null>(null);
  const [challenges, setChallenges] = useState<PassportChallengesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setOverview(null);
      setChallenges(null);
      setLoading(false);
      setError(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);

    void Promise.all([api.passportMe.getMyPassport(), api.passportMe.getMyPassportChallenges()])
      .then(([overviewRes, challengesRes]) => {
        if (requestId !== requestIdRef.current) return;
        setOverview(overviewRes);
        setChallenges(challengesRes);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError(true);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [api, enabled]);

  return { overview, challenges, loading, error };
}
