import type { ModerationTrustSafetyKpiCard } from "@yunicity/utils";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Flag,
  Layers,
  Tag,
} from "lucide-react";

function KpiIcon({ id }: { id: string }) {
  const className = "h-4 w-4";
  switch (id) {
    case "total":
      return <Layers className={className} aria-hidden />;
    case "pending":
      return <AlertCircle className={className} aria-hidden />;
    case "resolved":
      return <CheckCircle2 className={className} aria-hidden />;
    case "dismissed":
      return <Ban className={className} aria-hidden />;
    case "dominant_reason":
      return <Tag className={className} aria-hidden />;
    default:
      return <Flag className={className} aria-hidden />;
  }
}

export function ModerationKpiStrip({ cards }: { cards: ModerationTrustSafetyKpiCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      className="grid grid-cols-2 gap-2 lg:grid-cols-5"
      aria-label="Indicateurs Trust & Safety"
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
              card.id === "dominant_reason" ? "text-base leading-snug" : "text-xl"
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
