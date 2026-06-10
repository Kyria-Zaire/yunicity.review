import type { PassportOpsKpiCard } from "@yunicity/utils";
import { formatAdminMetric } from "@yunicity/utils";

interface PassportOpsKpiStripProps {
  cards: PassportOpsKpiCard[];
}

export function PassportOpsKpiStrip({ cards }: PassportOpsKpiStripProps) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
        >
          <dt className="text-xs font-medium text-stone-500">{card.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">
            {formatAdminMetric(card.value)}
          </dd>
          <dd className="mt-1 text-xs text-stone-500">{card.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
