import type { AdminPassportDetailStats } from "@yunicity/types";

interface PassportDetailStatsProps {
  stats: AdminPassportDetailStats;
}

export function PassportDetailStats({ stats }: PassportDetailStatsProps) {
  const cards = [
    { label: "Tampons", value: stats.stamps_total },
    { label: "Redemptions", value: stats.redemptions_total },
    { label: "Redemptions validées", value: stats.redemptions_completed },
  ];

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Statistiques
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-3"
          >
            <dt className="text-xs text-stone-600">{card.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">
              {card.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
