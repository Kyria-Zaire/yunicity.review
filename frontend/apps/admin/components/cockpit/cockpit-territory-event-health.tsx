import type { TerritoryEventHealthFields } from "@yunicity/types";
import { formatAdminMetric } from "@yunicity/utils";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

interface CockpitTerritoryEventHealthProps {
  health: TerritoryEventHealthFields;
}

const STATUS_STYLES: Record<TerritoryEventHealthFields["status"], string> = {
  healthy: "border-emerald-200 bg-emerald-50/90 text-emerald-950",
  warning: "border-amber-200 bg-amber-50/90 text-amber-950",
  critical: "border-rose-200 bg-rose-50/90 text-rose-950",
};

export function CockpitTerritoryEventHealth({ health }: CockpitTerritoryEventHealthProps) {
  return (
    <section
      className={`rounded-xl border p-4 shadow-sm ${STATUS_STYLES[health.status]}`}
      aria-labelledby="cockpit-event-health-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
              Agenda territorial
            </p>
            <h2 id="cockpit-event-health-title" className="text-base font-semibold">
              <span aria-hidden>{health.signal_emoji}</span> {health.label}
            </h2>
          </div>
        </div>
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold tabular-nums">
          {formatAdminMetric(health.upcoming_published_count)} à venir
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed opacity-90">
        Basé sur les événements publiés réellement à venir — seuil vivant : 5+.
      </p>
      <Link
        href="/events"
        className="mt-3 inline-block text-xs font-medium underline underline-offset-2"
      >
        Piloter l&apos;agenda →
      </Link>
    </section>
  );
}
