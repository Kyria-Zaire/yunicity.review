"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { mapAdminError } from "@/lib/admin-query";
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
} from "@yunicity/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

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

  const query = useQuery({
    queryKey: ["admin", "reports", "summary"],
    queryFn: () => adminReportsApi.getSummary(),
  });

  const { refetch } = query;
  const reloadSummary = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const metrics = useMemo(
    () =>
      query.data ? buildModerationTrustSafetyMetricsFromSummary(query.data) : null,
    [query.data],
  );

  const isLoading = query.isPending;
  const summaryError = mapAdminError(
    query.error,
    "Impossible de charger les indicateurs Trust & Safety. Réessayez dans un instant.",
  );

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
        reloadSummary,
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
      reloadSummary,
    };
  }, [isLoading, metrics, reloadSummary, summaryError]);
}
