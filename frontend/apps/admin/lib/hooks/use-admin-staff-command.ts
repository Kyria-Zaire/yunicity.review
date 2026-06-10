"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import {
  buildStaffConseilAction,
  buildStaffConseilMessage,
  buildStaffKpiCards,
  buildStaffMetricsFromSummary,
  buildStaffNextAction,
  buildStaffOrganizationalHealth,
  buildStaffSignal,
  isAuthError,
  type StaffKpiCard,
  type StaffMetrics,
  type StaffNextAction,
  type StaffOrganizationalHealth,
  type StaffSignal,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface StaffCommandState {
  metrics: StaffMetrics | null;
  signal: StaffSignal | null;
  nextAction: StaffNextAction | null;
  conseilMessage: string | null;
  conseilAction: StaffNextAction | null;
  kpiCards: StaffKpiCard[];
  organizationalHealth: StaffOrganizationalHealth | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useAdminStaffCommand(): StaffCommandState {
  const { adminStaffApi } = useAuth();
  const [metrics, setMetrics] = useState<StaffMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await adminStaffApi.getSummary();
      setMetrics(buildStaffMetricsFromSummary(summary));
    } catch (err) {
      setMetrics(null);
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les indicateurs d'accès plateforme. Réessayez dans un instant.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminStaffApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(() => {
    if (!metrics) {
      return {
        metrics: null,
        signal: null,
        nextAction: null,
        conseilMessage: null,
        conseilAction: null,
        kpiCards: [],
        organizationalHealth: null,
        isLoading,
        error,
        reload,
      };
    }

    return {
      metrics,
      signal: buildStaffSignal(metrics),
      nextAction: buildStaffNextAction(metrics),
      conseilMessage: buildStaffConseilMessage(metrics),
      conseilAction: buildStaffConseilAction(),
      kpiCards: buildStaffKpiCards(metrics),
      organizationalHealth: buildStaffOrganizationalHealth(metrics),
      isLoading,
      error: null,
      reload,
    };
  }, [error, isLoading, metrics, reload]);
}
