import type { AdminAnalyticsAttention } from "@yunicity/types";
import { formatAdminMetric } from "@yunicity/utils";

import { AnalyticsChartCard } from "@/components/analytics/analytics-chart-card";
import { AnalyticsDonutChart } from "@/components/analytics/analytics-donut-chart";
import { attentionTotal, buildOperationalHealthSegments } from "@/lib/analytics-display";

interface AnalyticsOperationalHealthProps {
  attention: AdminAnalyticsAttention;
}

export function AnalyticsOperationalHealth({ attention }: AnalyticsOperationalHealthProps) {
  const segments = buildOperationalHealthSegments(attention);
  const total = attentionTotal(attention);

  return (
    <AnalyticsChartCard title="Santé opérationnelle">
      <AnalyticsDonutChart
        segments={segments}
        centerLabel="Signaux"
        centerValue={formatAdminMetric(total)}
        emptyMessage="Aucun point d'attention — files d'attente maîtrisées."
      />
    </AnalyticsChartCard>
  );
}
