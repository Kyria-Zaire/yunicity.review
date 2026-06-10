import type { PartnerScanKpiCard } from "@yunicity/utils";
import { Clock3, Radio, ScanLine } from "lucide-react";

function KpiIcon({ id }: { id: string }) {
  const className = "h-4 w-4";
  switch (id) {
    case "mode":
      return <ScanLine className={className} aria-hidden />;
    case "status":
      return <Radio className={className} aria-hidden />;
    case "last":
      return <Clock3 className={className} aria-hidden />;
    default:
      return <ScanLine className={className} aria-hidden />;
  }
}

export function PartnerScanKpiStrip({ cards }: { cards: PartnerScanKpiCard[] }) {
  return (
    <section
      className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      aria-label="Contexte session scan"
    >
      {cards.map((card) => (
        <article
          key={card.id}
          className="rounded-xl border border-stone-200/80 bg-white px-3 py-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-stone-500">{card.label}</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yunicity-primary-soft text-yunicity-primary">
              <KpiIcon id={card.id} />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold tracking-tight text-stone-950">{card.value}</p>
          <p className="text-[11px] text-stone-500">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
