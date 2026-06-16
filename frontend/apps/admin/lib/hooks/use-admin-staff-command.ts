"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { mapAdminError } from "@/lib/admin-query";
import {
  buildStaffConseilAction,
  buildStaffConseilMessage,
  buildStaffKpiCards,
  buildStaffMetricsFromSummary,
  buildStaffNextAction,
  buildStaffOrganizationalHealth,
  buildStaffSignal,
  type StaffKpiCard,
  type StaffMetrics,
  type StaffNextAction,
  type StaffOrganizationalHealth,
  type StaffSignal,
} from "@yunicity/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

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

  const query = useQuery({
    queryKey: ["admin", "staff", "summary"],
    queryFn: () => adminStaffApi.getSummary(),
  });

  const { refetch } = query;
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const metrics = useMemo(
    () => (query.data ? buildStaffMetricsFromSummary(query.data) : null),
    [query.data],
  );

  const isLoading = query.isPending;
  const error = mapAdminError(
    query.error,
    "Impossible de charger les indicateurs d'accès plateforme. Réessayez dans un instant.",
  );

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
