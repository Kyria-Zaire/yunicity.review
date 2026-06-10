import type { CreatorContentEditorialKpiCard } from "@yunicity/utils";
import { formatAdminMetric } from "@yunicity/utils";
import { AlertCircle, CheckCircle2, Layers, PenLine, Users } from "lucide-react";

function KpiIcon({ id }: { id: string }) {
  const className = "h-4 w-4";
  switch (id) {
    case "total":
      return <Layers className={className} aria-hidden />;
    case "pending":
      return <AlertCircle className={className} aria-hidden />;
    case "approved":
      return <CheckCircle2 className={className} aria-hidden />;
    case "contributors":
      return <Users className={className} aria-hidden />;
    case "rejected":
      return <PenLine className={className} aria-hidden />;
    default:
      return <Layers className={className} aria-hidden />;
  }
}

export function CreatorContentKpiStrip({ cards }: { cards: CreatorContentEditorialKpiCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      className="grid grid-cols-2 gap-2 lg:grid-cols-5"
      aria-label="Indicateurs éditoriaux territoriaux"
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
          <p className="text-[11px] text-stone-500">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
