import type { AdminActivitySummary } from "@yunicity/types";

import { ActivitySeverityBadge } from "@/components/activity/activity-severity-badge";
import {
  activityAlertSeverityLabel,
  activityHealthStatusLabel,
} from "@/lib/activity-display";

interface ActivitySummaryCardsProps {
  summary: AdminActivitySummary;
}

export function ActivitySummaryCards({ summary }: ActivitySummaryCardsProps) {
  const cards = [
    {
      title: "Action requise",
      value: summary.attention.critical,
      severity: summary.attention.critical > 0 ? ("critical" as const) : ("healthy" as const),
      hint: "Alertes critiques ou infrastructure en erreur.",
    },
    {
      title: "À surveiller",
      value: summary.attention.warning,
      severity: summary.attention.warning > 0 ? ("warning" as const) : ("healthy" as const),
      hint: "Files en attente ou composants partiellement indisponibles.",
    },
    {
      title: "Système",
      value: summary.sections.system.count,
      severity: summary.sections.system.severity,
      hint: activityHealthStatusLabel(summary.health.status),
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-2xl border border-[#E7EAF3] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-stone-600">{card.title}</h2>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                {card.value}
              </p>
            </div>
            <ActivitySeverityBadge
              variant="alert"
              severity={card.severity}
              label={activityAlertSeverityLabel(card.severity)}
            />
          </div>
          <p className="mt-3 text-xs text-stone-500">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
