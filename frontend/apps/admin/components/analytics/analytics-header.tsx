import type { AdminAnalyticsScope } from "@yunicity/types";

import { AnalyticsPeriodFilter } from "@/components/analytics/analytics-period-filter";
import { formatAnalyticsPeriodRange } from "@/lib/analytics-display";

interface AnalyticsHeaderProps {
  scope: AdminAnalyticsScope;
  generatedAt: string;
  period: AdminAnalyticsScope["period"];
  isLoading: boolean;
  onPeriodChange: (period: AdminAnalyticsScope["period"]) => void;
}

export function AnalyticsHeader({
  scope,
  generatedAt,
  period,
  isLoading,
  onPeriodChange,
}: AnalyticsHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-950">Analytics / Insights</h1>
        <p className="max-w-2xl text-sm text-stone-600">
          Suivez la performance de la plateforme et l&apos;activité sur Yunicity.
        </p>
        <p className="text-xs text-stone-500">
          Territoire pilote : {scope.city}
        </p>
      </div>
      <AnalyticsPeriodFilter
        period={period}
        periodLabel={formatAnalyticsPeriodRange(period, generatedAt)}
        isLoading={isLoading}
        onChange={onPeriodChange}
      />
    </header>
  );
}
