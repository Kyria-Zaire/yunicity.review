import type { AdminActivityHealth } from "@yunicity/types";

import { ActivitySeverityBadge } from "@/components/activity/activity-severity-badge";
import { activityHealthStatusLabel } from "@/lib/activity-display";

interface ActivityHealthCardProps {
  health: AdminActivityHealth;
}

function checkLabel(status: string): string {
  if (status === "ok") return "Opérationnel";
  if (status === "error") return "Erreur";
  return "Inconnu";
}

export function ActivityHealthCard({ health }: ActivityHealthCardProps) {
  const severity =
    health.status === "critical"
      ? "critical"
      : health.status === "degraded"
        ? "warning"
        : "healthy";

  return (
    <section className="rounded-2xl border border-[#E7EAF3] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Santé système</h2>
          <p className="mt-1 text-sm text-stone-600">État infrastructure au chargement de la page.</p>
        </div>
        <ActivitySeverityBadge
          variant="alert"
          severity={severity}
          label={activityHealthStatusLabel(health.status)}
        />
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Base de données
          </dt>
          <dd className="mt-1 text-sm font-medium text-stone-900">{checkLabel(health.database)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Redis</dt>
          <dd className="mt-1 text-sm font-medium text-stone-900">{checkLabel(health.redis)}</dd>
        </div>
      </dl>
    </section>
  );
}
