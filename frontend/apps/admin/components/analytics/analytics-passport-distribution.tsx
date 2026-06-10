import type { AdminAnalyticsSummary } from "@yunicity/types";
import { formatAdminMetric } from "@yunicity/utils";

import { AnalyticsChartCard } from "@/components/analytics/analytics-chart-card";
import { AnalyticsDonutChart } from "@/components/analytics/analytics-donut-chart";
import { buildPassportDistribution, passportActivityInPeriod } from "@/lib/analytics-display";

interface AnalyticsPassportDistributionProps {
  summary: AdminAnalyticsSummary;
}

export function AnalyticsPassportDistribution({ summary }: AnalyticsPassportDistributionProps) {
  const segments = buildPassportDistribution(summary);
  const total = passportActivityInPeriod(summary);

  return (
    <AnalyticsChartCard title="Répartition Passport">
      <AnalyticsDonutChart
        segments={segments}
        centerLabel="Activité période"
        centerValue={formatAdminMetric(total)}
        emptyMessage="Aucune activité Passport enregistrée sur la période sélectionnée."
      />
    </AnalyticsChartCard>
  );
}
