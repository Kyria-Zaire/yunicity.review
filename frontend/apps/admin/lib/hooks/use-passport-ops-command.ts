"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminPassportListItem } from "@yunicity/types";
import {
  buildPassportOpsEngagedCitizens,
  buildPassportOpsIntelligence,
  buildPassportOpsKpiCards,
  buildPassportOpsMetricsFromCockpit,
  buildPassportOpsMetricsFromList,
  buildPassportOpsMomentum,
  buildPassportOpsRecommendedAction,
  buildPassportOpsSignal,
  buildPassportOpsDetailPath,
  adminPassportTierLabel,
  type PassportOpsProgramMetrics,
} from "@yunicity/utils";
import { useEffect, useMemo, useState } from "react";

export function usePassportOpsCommand(
  city: string,
  hasSearchQuery: boolean,
  total: number,
  items: AdminPassportListItem[],
) {
  const { adminCockpitApi, adminPassportsApi } = useAuth();
  const [suspendedTotal, setSuspendedTotal] = useState(0);
  const [cockpitPassport, setCockpitPassport] = useState<
    Parameters<typeof buildPassportOpsMetricsFromCockpit>[1] | null
  >(null);
  const [topPartner, setTopPartner] = useState<
    Parameters<typeof buildPassportOpsIntelligence>[1] | null
  >(null);

  useEffect(() => {
    if (hasSearchQuery) {
      setCockpitPassport(null);
      setTopPartner(null);
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
        setTopPartner(summary.signals.top_stamp_partner);
        setSuspendedTotal(suspended.total);
      } catch {
        if (!cancelled) {
          setCockpitPassport(null);
          setTopPartner(null);
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

  return useMemo(
    () => ({
      metrics,
      signal: buildPassportOpsSignal(metrics),
      recommendedAction: buildPassportOpsRecommendedAction(metrics),
      kpiCards: buildPassportOpsKpiCards(metrics),
      momentum: buildPassportOpsMomentum(metrics),
      engagedCitizens: buildPassportOpsEngagedCitizens(
        items,
        adminPassportTierLabel,
        buildPassportOpsDetailPath,
      ),
      intelligence: buildPassportOpsIntelligence(metrics, topPartner),
    }),
    [items, metrics, topPartner],
  );
}
