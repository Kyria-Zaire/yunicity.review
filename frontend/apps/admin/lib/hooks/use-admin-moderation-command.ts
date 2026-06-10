"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  buildModerationTrustSafetyConseilMessage,
  buildModerationTrustSafetyKpiCards,
  buildModerationTrustSafetyMetricsFromSummary,
  buildModerationTrustSafetyMomentum,
  buildModerationTrustSafetyNextAction,
  buildModerationTrustSafetyRecommendedAction,
  buildModerationTrustSafetySignal,
  type ModerationTrustSafetyKpiCard,
  type ModerationTrustSafetyMetrics,
  type ModerationTrustSafetyMomentum,
  type ModerationTrustSafetyNextAction,
  type ModerationTrustSafetySignal,
  isAuthError,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface ModerationCommandState {
  metrics: ModerationTrustSafetyMetrics | null;
  signal: ModerationTrustSafetySignal | null;
  nextAction: ModerationTrustSafetyNextAction | null;
  recommendedAction: ModerationTrustSafetyNextAction | null;
  conseilMessage: string | null;
  kpiCards: ModerationTrustSafetyKpiCard[];
  momentum: ModerationTrustSafetyMomentum | null;
  isLoading: boolean;
  summaryError: string | null;
  reloadSummary: () => Promise<void>;
}

export function useAdminModerationCommand(): ModerationCommandState {
  const { adminReportsApi } = useAuth();
  const [metrics, setMetrics] = useState<ModerationTrustSafetyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setSummaryError(null);
    try {
      const summary = await adminReportsApi.getSummary();
      setMetrics(buildModerationTrustSafetyMetricsFromSummary(summary));
    } catch (err) {
      setMetrics(null);
      setSummaryError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les indicateurs Trust & Safety. Réessayez dans un instant.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminReportsApi]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return useMemo(() => {
    if (!metrics) {
      return {
        metrics: null,
        signal: null,
        nextAction: null,
        recommendedAction: null,
        conseilMessage: null,
        kpiCards: [],
        momentum: null,
        isLoading,
        summaryError,
        reloadSummary: loadSummary,
      };
    }

    return {
      metrics,
      signal: buildModerationTrustSafetySignal(metrics),
      nextAction: buildModerationTrustSafetyNextAction(metrics),
      recommendedAction: buildModerationTrustSafetyRecommendedAction(metrics),
      conseilMessage: buildModerationTrustSafetyConseilMessage(metrics),
      kpiCards: buildModerationTrustSafetyKpiCards(metrics),
      momentum: buildModerationTrustSafetyMomentum(metrics),
      isLoading,
      summaryError: null,
      reloadSummary: loadSummary,
    };
  }, [isLoading, loadSummary, metrics, summaryError]);
}
