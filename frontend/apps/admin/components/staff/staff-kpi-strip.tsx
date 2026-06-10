import type { StaffKpiCard } from "@yunicity/utils";
import {
  Crown,
  KeyRound,
  Layers,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

function KpiIcon({ id }: { id: string }) {
  const className = "h-4 w-4";
  switch (id) {
    case "total":
      return <Layers className={className} aria-hidden />;
    case "active":
      return <UserCheck className={className} aria-hidden />;
    case "suspended":
      return <ShieldAlert className={className} aria-hidden />;
    case "super_admins":
      return <Crown className={className} aria-hidden />;
    case "dominant_role":
      return <KeyRound className={className} aria-hidden />;
    default:
      return <Layers className={className} aria-hidden />;
  }
}

export function StaffKpiStrip({ cards }: { cards: StaffKpiCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      className="grid grid-cols-2 gap-2 lg:grid-cols-5"
      aria-label="Indicateurs gouvernance staff"
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
          <p
            className={`mt-1 font-bold tracking-tight text-stone-950 tabular-nums ${
              card.id === "dominant_role" ? "text-base leading-snug" : "text-xl"
            }`}
          >
            {card.displayValue}
          </p>
          <p className="text-[11px] text-stone-500">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
