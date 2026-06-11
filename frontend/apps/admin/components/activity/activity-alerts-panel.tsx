import type { AdminActivityAlert } from "@yunicity/types";
import Link from "next/link";

import { ActivitySeverityBadge } from "@/components/activity/activity-severity-badge";
import { activityAlertSeverityLabel } from "@/lib/activity-display";

interface ActivityAlertsPanelProps {
  alerts: AdminActivityAlert[];
}

export function ActivityAlertsPanel({ alerts }: ActivityAlertsPanelProps) {
  const visibleAlerts = alerts.filter((alert) => alert.severity !== "healthy");

  return (
    <section className="rounded-2xl border border-[#E7EAF3] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-stone-900">Alertes</h2>
        <p className="mt-1 text-sm text-stone-600">Éléments nécessitant une attention staff.</p>
      </div>
      {visibleAlerts.length === 0 ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
          Aucune alerte active — territoire serein.
        </p>
      ) : (
        <ul className="space-y-3">
          {visibleAlerts.map((alert) => (
            <li key={alert.id}>
              <Link
                href={alert.href}
                className="block rounded-xl border border-stone-100 bg-stone-50/50 px-4 py-3 transition-colors hover:border-yunicity-primary/30 hover:bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{alert.label}</p>
                    <p className="mt-1 text-xs text-stone-600">{alert.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-900">{alert.count}</span>
                    <ActivitySeverityBadge
                      variant="alert"
                      severity={alert.severity}
                      label={activityAlertSeverityLabel(alert.severity)}
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
