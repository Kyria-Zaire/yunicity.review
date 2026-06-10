import type { PassportOpsDashboardKpi } from "@yunicity/utils";
import { formatAdminMetric } from "@yunicity/utils";
import {
  CalendarDays,
  Stamp,
  Ticket,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

interface PassportOpsKpiStripProps {
  cards: PassportOpsDashboardKpi[];
}

function KpiIcon({ id }: { id: string }) {
  const className = "h-4 w-4";
  switch (id) {
    case "passports":
      return <CalendarDays className={className} aria-hidden />;
    case "active-citizens":
      return <Users className={className} aria-hidden />;
    case "redemptions":
      return <Ticket className={className} aria-hidden />;
    case "stamps-today":
      return <Stamp className={className} aria-hidden />;
    case "new-week":
      return <UserPlus className={className} aria-hidden />;
    default:
      return <UserCheck className={className} aria-hidden />;
  }
}

export function PassportOpsKpiStrip({ cards }: PassportOpsKpiStripProps) {
  return (
    <section
      className="grid grid-cols-2 gap-2 lg:grid-cols-5"
      aria-label="Indicateurs Passport Ops"
    >
      {cards.map((card) => (
        <article
          key={card.id}
          className="rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-stone-500">{card.label}</p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yunicity-primary-soft text-yunicity-primary">
              <KpiIcon id={card.id} />
            </span>
          </div>
          <p className="mt-1 text-xl font-bold tracking-tight text-stone-950 tabular-nums">
            {formatAdminMetric(card.value)}
          </p>
          <p
            className={`text-[11px] ${
              card.trendTone === "positive" ? "text-emerald-600" : "text-stone-500"
            }`}
          >
            {card.trend}
          </p>
        </article>
      ))}
    </section>
  );
}
