"use client";

import { AnalyticsDataFooter } from "@/components/analytics/analytics-data-footer";
import { AnalyticsEmptyState } from "@/components/analytics/analytics-empty-state";
import { AnalyticsErrorState } from "@/components/analytics/analytics-error-state";
import { AnalyticsEvolutionPanel } from "@/components/analytics/analytics-evolution-panel";
import { AnalyticsHeader } from "@/components/analytics/analytics-header";
import { AnalyticsKpiGrid } from "@/components/analytics/analytics-kpi-grid";
import { AnalyticsLoadingState } from "@/components/analytics/analytics-loading-state";
import { AnalyticsModuleActivity } from "@/components/analytics/analytics-module-activity";
import { AnalyticsOperationalHealth } from "@/components/analytics/analytics-operational-health";
import { AnalyticsPassportDistribution } from "@/components/analytics/analytics-passport-distribution";
import { AnalyticsTopCities } from "@/components/analytics/analytics-top-cities";
import { useAdminAnalytics } from "@/lib/hooks/use-admin-analytics";

function isTerritoryEmpty(summary: NonNullable<ReturnType<typeof useAdminAnalytics>["summary"]>) {
  return (
    summary.growth.active_users === 0 &&
    summary.partners.total_partners === 0 &&
    summary.offers.total === 0 &&
    summary.events.total === 0 &&
    summary.creators.contents_total === 0 &&
    summary.crm.total_leads === 0
  );
}

export function AnalyticsPage() {
  const { summary, isLoading, error, period, setPeriod, reload } = useAdminAnalytics();

  if (isLoading && !summary) {
    return <AnalyticsLoadingState />;
  }

  if (error && !summary) {
    return <AnalyticsErrorState message={error} onRetry={() => void reload()} />;
  }

  if (!summary) {
    return <AnalyticsEmptyState />;
  }

  const territoryEmpty = isTerritoryEmpty(summary);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <AnalyticsHeader
        scope={summary.scope}
        generatedAt={summary.generated_at}
        period={period}
        isLoading={isLoading}
        onPeriodChange={setPeriod}
      />

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {territoryEmpty ? <AnalyticsEmptyState /> : null}

      <AnalyticsKpiGrid
        growth={summary.growth}
        passport={summary.passport}
        attention={summary.attention}
        scope={summary.scope}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AnalyticsEvolutionPanel />
        <AnalyticsPassportDistribution summary={summary} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AnalyticsModuleActivity summary={summary} />
        <AnalyticsTopCities scope={summary.scope} activeUsers={summary.growth.active_users} />
        <AnalyticsOperationalHealth attention={summary.attention} />
      </div>

      <AnalyticsDataFooter />

      <p className="text-[11px] text-stone-400">
        Agrégats générés le{" "}
        {new Date(summary.generated_at).toLocaleString("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        . Aucune donnée personnelle exposée.
      </p>
    </div>
  );
}
