"use client";

import type { AdminPartnerCounters } from "@yunicity/types";

interface PartnerDetailCountersProps {
  counters: AdminPartnerCounters;
}

function CounterCard({
  title,
  lines,
}: {
  title: string;
  lines: { label: string; value: number }[];
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
      <ul className="mt-3 space-y-1.5">
        {lines.map((line) => (
          <li key={line.label} className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-stone-600">{line.label}</span>
            <span className="font-semibold tabular-nums text-stone-900">{line.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PartnerDetailCounters({ counters }: PartnerDetailCountersProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Compteurs opérationnels
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CounterCard
          title="Offres"
          lines={[
            { label: "Total", value: counters.offers_total },
            { label: "En revue", value: counters.offers_pending },
            { label: "Publiées", value: counters.offers_published },
          ]}
        />
        <CounterCard
          title="Contenus créateurs"
          lines={[
            { label: "Total", value: counters.creator_contents_total },
            { label: "En revue", value: counters.creator_contents_pending },
          ]}
        />
        <CounterCard
          title="Événements"
          lines={[
            { label: "Total", value: counters.events_total },
            { label: "En revue", value: counters.events_pending },
          ]}
        />
        <CounterCard
          title="Stamps"
          lines={[{ label: "Total", value: counters.stamps_total }]}
        />
        <CounterCard
          title="Redemptions"
          lines={[
            { label: "Total", value: counters.redemptions_total },
            { label: "Complétées", value: counters.redemptions_completed },
          ]}
        />
      </div>
    </section>
  );
}
