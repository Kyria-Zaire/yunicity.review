import type { AdminAnalyticsAttention, AdminAnalyticsGrowth, AdminAnalyticsPassport, AdminAnalyticsScope } from "@yunicity/types";
import { formatAdminMetric } from "@yunicity/utils";
import { AlertTriangle, IdCard, TrendingUp, Users } from "lucide-react";

import { AnalyticsKpiCard } from "@/components/analytics/analytics-kpi-card";
import { attentionTotal, formatVariationPercent, variationTone } from "@/lib/analytics-display";

interface AnalyticsKpiGridProps {
  growth: AdminAnalyticsGrowth;
  passport: AdminAnalyticsPassport;
  attention: AdminAnalyticsAttention;
  scope: AdminAnalyticsScope;
}

export function AnalyticsKpiGrid({
  growth,
  passport,
  attention,
  scope,
}: AnalyticsKpiGridProps) {
  const passportActivity = passport.stamps_in_period + passport.redemptions_in_period;
  const attentionCount = attentionTotal(attention);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs clés">
      <AnalyticsKpiCard
        label="Utilisateurs actifs"
        value={formatAdminMetric(growth.active_users)}
        variation="Comparaison indisponible"
        variationTone="neutral"
        icon={Users}
        tone="violet"
      />
      <AnalyticsKpiCard
        label="Nouveaux utilisateurs"
        value={formatAdminMetric(growth.new_users)}
        variation={formatVariationPercent(growth.growth_rate_percent, scope.compare_enabled)}
        variationTone={variationTone(growth.growth_rate_percent, scope.compare_enabled)}
        icon={TrendingUp}
        tone="green"
      />
      <AnalyticsKpiCard
        label="Activité Passport"
        value={formatAdminMetric(passportActivity)}
        variation={`${formatAdminMetric(passport.activated_in_period)} activations sur la période`}
        variationTone="neutral"
        icon={IdCard}
        tone="orange"
      />
      <AnalyticsKpiCard
        label="Points d'attention"
        value={formatAdminMetric(attentionCount)}
        variation="Files d'attente et leads ouverts"
        variationTone={attentionCount > 0 ? "negative" : "neutral"}
        icon={AlertTriangle}
        tone="rose"
      />
    </section>
  );
}
