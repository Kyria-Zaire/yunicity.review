import type { AdminAnalyticsScope } from "@yunicity/types";
import { formatAdminMetric } from "@yunicity/utils";

import { AnalyticsChartCard } from "@/components/analytics/analytics-chart-card";

interface AnalyticsTopCitiesProps {
  scope: AdminAnalyticsScope;
  activeUsers: number;
}

export function AnalyticsTopCities({ scope, activeUsers }: AnalyticsTopCitiesProps) {
  const width = activeUsers > 0 ? 100 : 0;

  return (
    <AnalyticsChartCard title="Top villes">
      <div className="mb-3 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs text-violet-800">
        Déploiement pilote — seule la ville active est disponible dans les agrégats actuels.
      </div>
      <div className="overflow-hidden rounded-xl border border-[#E7EAF3]">
        <div className="grid grid-cols-2 border-b border-[#E7EAF3] bg-stone-50 px-3 py-2 text-xs font-medium text-stone-500">
          <span>Ville</span>
          <span className="text-right">Utilisateurs actifs</span>
        </div>
        <div className="px-3 py-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-stone-800">{scope.city}</span>
            <span className="font-semibold tabular-nums text-stone-950">
              {formatAdminMetric(activeUsers)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${width}%` }}
              role="presentation"
            />
          </div>
        </div>
      </div>
    </AnalyticsChartCard>
  );
}
