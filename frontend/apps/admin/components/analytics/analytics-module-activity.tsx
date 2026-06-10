import type { AdminAnalyticsSummary } from "@yunicity/types";

import { AnalyticsChartCard } from "@/components/analytics/analytics-chart-card";
import { AnalyticsHorizontalBars } from "@/components/analytics/analytics-horizontal-bars";
import { buildModuleActivityBars } from "@/lib/analytics-display";

interface AnalyticsModuleActivityProps {
  summary: AdminAnalyticsSummary;
}

export function AnalyticsModuleActivity({ summary }: AnalyticsModuleActivityProps) {
  return (
    <AnalyticsChartCard title="Activité par module">
      <AnalyticsHorizontalBars
        items={buildModuleActivityBars(summary)}
        emptyMessage="Aucune activité module disponible pour cette période."
      />
    </AnalyticsChartCard>
  );
}
