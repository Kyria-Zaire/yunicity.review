import type { AdminAnalyticsEvents } from "@yunicity/types";
import { formatAdminMetric, territoryEventHealth } from "@yunicity/utils";
import { CalendarClock, CalendarRange, CalendarX2 } from "lucide-react";

import { AnalyticsKpiCard } from "@/components/analytics/analytics-kpi-card";

interface AnalyticsEventsVitalityProps {
  events: AdminAnalyticsEvents;
}

export function AnalyticsEventsVitality({ events }: AnalyticsEventsVitalityProps) {
  const health = territoryEventHealth(events.upcoming);

  return (
    <section className="space-y-3" aria-labelledby="analytics-events-vitality-title">
      <div>
        <h2
          id="analytics-events-vitality-title"
          className="text-sm font-semibold text-stone-900"
        >
          Vitalité événementielle
        </h2>
        <p className="text-xs text-stone-500">
          Stock (publiés / terminés) séparé du flux (à venir).
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <AnalyticsKpiCard
          label="Événements publiés"
          value={formatAdminMetric(events.published)}
          variation="Stock actif (approuvés, non annulés)"
          variationTone="neutral"
          icon={CalendarRange}
          tone="green"
        />
        <AnalyticsKpiCard
          label="Événements à venir"
          value={formatAdminMetric(events.upcoming)}
          variation={`${health.signal_emoji} ${health.label}`}
          variationTone={
            health.status === "healthy"
              ? "positive"
              : health.status === "critical"
                ? "negative"
                : "neutral"
          }
          icon={CalendarClock}
          tone="violet"
        />
        <AnalyticsKpiCard
          label="Événements terminés"
          value={formatAdminMetric(events.past)}
          variation="Historique publié"
          variationTone="neutral"
          icon={CalendarX2}
          tone="orange"
        />
      </div>
    </section>
  );
}
