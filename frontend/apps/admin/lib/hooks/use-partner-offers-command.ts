"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  buildPartnerOffersCatalogKpiCards,
  buildPartnerOffersCatalogMomentum,
  buildPartnerOffersCatalogNextAction,
  buildPartnerOffersCatalogSignal,
  buildPartnerOffersConseilMessage,
  buildPartnerOffersMetricsFromSummary,
  buildPartnerOffersRecommendedAction,
  type PartnerOffersCatalogKpiCard,
  type PartnerOffersCatalogMetrics,
  type PartnerOffersCatalogMomentum,
  type PartnerOffersCatalogNextAction,
  type PartnerOffersCatalogSignal,
} from "@yunicity/utils";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface PartnerOffersCommandState {
  metrics: PartnerOffersCatalogMetrics | null;
  signal: PartnerOffersCatalogSignal | null;
  nextAction: PartnerOffersCatalogNextAction | null;
  recommendedAction: PartnerOffersCatalogNextAction | null;
  conseilMessage: string | null;
  kpiCards: PartnerOffersCatalogKpiCard[];
  momentum: PartnerOffersCatalogMomentum | null;
  isLoading: boolean;
  summaryError: string | null;
  reloadSummary: () => Promise<void>;
}

export function usePartnerOffersCommand(city: string): PartnerOffersCommandState {
  const { partnerOffersAdminApi } = useAuth();
  const [metrics, setMetrics] = useState<PartnerOffersCatalogMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setSummaryError(null);
    try {
      const summary = await partnerOffersAdminApi.getSummary({ city });
      setMetrics(buildPartnerOffersMetricsFromSummary(summary));
    } catch (err) {
      setMetrics(null);
      setSummaryError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les indicateurs du catalogue. Réessayez dans un instant.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [city, partnerOffersAdminApi]);

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
      signal: buildPartnerOffersCatalogSignal(metrics),
      nextAction: buildPartnerOffersCatalogNextAction(metrics),
      recommendedAction: buildPartnerOffersRecommendedAction(metrics),
      conseilMessage: buildPartnerOffersConseilMessage(metrics),
      kpiCards: buildPartnerOffersCatalogKpiCards(metrics),
      momentum: buildPartnerOffersCatalogMomentum(metrics),
      isLoading,
      summaryError: null,
      reloadSummary: loadSummary,
    };
  }, [isLoading, loadSummary, metrics, summaryError]);
}
