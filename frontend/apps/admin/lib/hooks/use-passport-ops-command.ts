"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminCockpitSignals, AdminPassportListItem } from "@yunicity/types";
import {
  buildPassportOpsConseilMessage,
  buildPassportOpsDashboardKpisFromCockpit,
  buildPassportOpsDashboardKpisFromList,
  buildPassportOpsMetricsFromCockpit,
  buildPassportOpsMetricsFromList,
  buildPassportOpsMomentum,
  buildPassportOpsNextAction,
  buildPassportOpsRecommendedAction,
  buildPassportOpsSignal,
  type PassportOpsDashboardKpi,
  type PassportOpsMomentum,
  type PassportOpsNextAction,
  type PassportOpsProgramMetrics,
  type PassportOpsRecommendedAction,
  type PassportOpsSignal,
} from "@yunicity/utils";
import { useEffect, useMemo, useState } from "react";

export interface PassportOpsCommandState {
  metrics: PassportOpsProgramMetrics;
  signal: PassportOpsSignal;
  nextAction: PassportOpsNextAction;
  recommendedAction: PassportOpsRecommendedAction;
  conseilMessage: string;
  dashboardKpis: PassportOpsDashboardKpi[];
  momentum: PassportOpsMomentum;
}

export function usePassportOpsCommand(
  city: string,
  hasSearchQuery: boolean,
  total: number,
  items: AdminPassportListItem[],
): PassportOpsCommandState {
  const { adminCockpitApi, adminPassportsApi } = useAuth();
  const [suspendedTotal, setSuspendedTotal] = useState(0);
  const [cockpitPassport, setCockpitPassport] = useState<
    Parameters<typeof buildPassportOpsMetricsFromCockpit>[1] | null
  >(null);
  const [cockpitSignals, setCockpitSignals] = useState<AdminCockpitSignals | null>(null);

  useEffect(() => {
    if (hasSearchQuery) {
      setCockpitPassport(null);
      setCockpitSignals(null);
      setSuspendedTotal(0);
      return;
    }

    let cancelled = false;

    async function loadProgramContext() {
      try {
        const [summary, suspended] = await Promise.all([
          adminCockpitApi.getSummary({ city }),
          adminPassportsApi.listPassports({
            city,
            status: "suspended",
            page: 1,
            page_size: 1,
          }),
        ]);
        if (cancelled) {
          return;
        }
        setCockpitPassport(summary.passport);
        setCockpitSignals(summary.signals);
        setSuspendedTotal(suspended.total);
      } catch {
        if (!cancelled) {
          setCockpitPassport(null);
          setCockpitSignals(null);
          setSuspendedTotal(0);
        }
      }
    }

    void loadProgramContext();
    return () => {
      cancelled = true;
    };
  }, [adminCockpitApi, adminPassportsApi, city, hasSearchQuery]);

  const metrics: PassportOpsProgramMetrics = useMemo(() => {
    if (hasSearchQuery || !cockpitPassport) {
      return buildPassportOpsMetricsFromList(city, total, items, hasSearchQuery);
    }
    return buildPassportOpsMetricsFromCockpit(city, cockpitPassport, suspendedTotal);
  }, [city, cockpitPassport, hasSearchQuery, items, suspendedTotal, total]);

  const dashboardKpis = useMemo(() => {
    if (!hasSearchQuery && cockpitPassport && cockpitSignals) {
      return buildPassportOpsDashboardKpisFromCockpit(
        cockpitPassport,
        cockpitSignals,
        suspendedTotal,
      );
    }
    return buildPassportOpsDashboardKpisFromList(metrics);
  }, [cockpitPassport, cockpitSignals, hasSearchQuery, metrics, suspendedTotal]);

  return useMemo(
    () => ({
      metrics,
      signal: buildPassportOpsSignal(metrics),
      nextAction: buildPassportOpsNextAction(metrics),
      recommendedAction: buildPassportOpsRecommendedAction(metrics),
      conseilMessage: buildPassportOpsConseilMessage(metrics),
      dashboardKpis,
      momentum: buildPassportOpsMomentum(metrics),
    }),
    [dashboardKpis, metrics],
  );
}
