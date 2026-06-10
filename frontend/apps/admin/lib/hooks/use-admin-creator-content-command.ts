"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  buildCreatorContentEditorialConseilMessage,
  buildCreatorContentEditorialKpiCards,
  buildCreatorContentEditorialMetricsFromSummary,
  buildCreatorContentEditorialMomentum,
  buildCreatorContentEditorialNextAction,
  buildCreatorContentEditorialRecommendedAction,
  buildCreatorContentEditorialSignal,
  type CreatorContentEditorialKpiCard,
  type CreatorContentEditorialMetrics,
  type CreatorContentEditorialMomentum,
  type CreatorContentEditorialNextAction,
  type CreatorContentEditorialSignal,
  isAuthError,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface CreatorContentCommandState {
  metrics: CreatorContentEditorialMetrics | null;
  signal: CreatorContentEditorialSignal | null;
  nextAction: CreatorContentEditorialNextAction | null;
  recommendedAction: CreatorContentEditorialNextAction | null;
  conseilMessage: string | null;
  kpiCards: CreatorContentEditorialKpiCard[];
  momentum: CreatorContentEditorialMomentum | null;
  isLoading: boolean;
  summaryError: string | null;
  reloadSummary: () => Promise<void>;
}

export function useAdminCreatorContentCommand(city: string): CreatorContentCommandState {
  const { partnerCreatorContentAdminApi } = useAuth();
  const [metrics, setMetrics] = useState<CreatorContentEditorialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setSummaryError(null);
    try {
      const summary = await partnerCreatorContentAdminApi.getSummary({ city });
      setMetrics(buildCreatorContentEditorialMetricsFromSummary(summary));
    } catch (err) {
      setMetrics(null);
      setSummaryError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les indicateurs éditoriaux. Réessayez dans un instant.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [city, partnerCreatorContentAdminApi]);

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
      signal: buildCreatorContentEditorialSignal(metrics),
      nextAction: buildCreatorContentEditorialNextAction(metrics),
      recommendedAction: buildCreatorContentEditorialRecommendedAction(metrics),
      conseilMessage: buildCreatorContentEditorialConseilMessage(metrics),
      kpiCards: buildCreatorContentEditorialKpiCards(metrics),
      momentum: buildCreatorContentEditorialMomentum(metrics),
      isLoading,
      summaryError: null,
      reloadSummary: loadSummary,
    };
  }, [isLoading, loadSummary, metrics, summaryError]);
}
