"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  buildEventsAgendaConseilMessage,
  buildEventsAgendaKpiCards,
  buildEventsAgendaMetricsFromSummary,
  buildEventsAgendaMomentum,
  buildEventsAgendaNextAction,
  buildEventsAgendaRecommendedAction,
  buildEventsAgendaSignal,
  type EventsAgendaKpiCard,
  type EventsAgendaMetrics,
  type EventsAgendaMomentum,
  type EventsAgendaNextAction,
  type EventsAgendaSignal,
  isAuthError,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface EventsCommandState {
  metrics: EventsAgendaMetrics | null;
  signal: EventsAgendaSignal | null;
  nextAction: EventsAgendaNextAction | null;
  recommendedAction: EventsAgendaNextAction | null;
  conseilMessage: string | null;
  kpiCards: EventsAgendaKpiCard[];
  momentum: EventsAgendaMomentum | null;
  isLoading: boolean;
  summaryError: string | null;
  reloadSummary: () => Promise<void>;
}

export function useAdminEventsCommand(city: string): EventsCommandState {
  const { adminEventsApi } = useAuth();
  const [metrics, setMetrics] = useState<EventsAgendaMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setSummaryError(null);
    try {
      const summary = await adminEventsApi.getSummary({ city });
      setMetrics(buildEventsAgendaMetricsFromSummary(summary));
    } catch (err) {
      setMetrics(null);
      setSummaryError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les indicateurs de l'agenda. Réessayez dans un instant.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminEventsApi, city]);

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
      signal: buildEventsAgendaSignal(metrics),
      nextAction: buildEventsAgendaNextAction(metrics),
      recommendedAction: buildEventsAgendaRecommendedAction(metrics),
      conseilMessage: buildEventsAgendaConseilMessage(metrics),
      kpiCards: buildEventsAgendaKpiCards(metrics),
      momentum: buildEventsAgendaMomentum(metrics),
      isLoading,
      summaryError: null,
      reloadSummary: loadSummary,
    };
  }, [isLoading, loadSummary, metrics, summaryError]);
}
