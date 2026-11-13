"use client";

import type { NeighborhoodDetailMediumPillar } from "@yunicity/utils";
import { NEIGHBORHOOD_DETAIL_MEDIUM_IDENTITY_TITLE } from "@yunicity/utils";
import { Building2, Leaf, Store } from "lucide-react";

const PILLAR_ICON = {
  heritage: Building2,
  local: Store,
  green: Leaf,
} as const;

const PILLAR_TONE: Record<NeighborhoodDetailMediumPillar["tone"], string> = {
  purple: "bg-violet-50 text-violet-700",
  peach: "bg-orange-50 text-orange-700",
  green: "bg-emerald-50 text-emerald-700",
};

type NeighborhoodDetailMediumIdentitySectionProps = {
  body: string;
  pillars: NeighborhoodDetailMediumPillar[];
};

export function NeighborhoodDetailMediumIdentitySection({
  body,
  pillars,
}: NeighborhoodDetailMediumIdentitySectionProps) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold tracking-tight text-neutral-950">
        {NEIGHBORHOOD_DETAIL_MEDIUM_IDENTITY_TITLE}
      </h2>
      <div className="neighborhood-detail-medium-identity-grid mt-4 gap-5">
        <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">{body}</p>
        <ul className="space-y-3">
          {pillars.map((pillar) => {
            const Icon = PILLAR_ICON[pillar.id as keyof typeof PILLAR_ICON] ?? Building2;
            return (
              <li key={pillar.id} className="flex items-start gap-3">
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${PILLAR_TONE[pillar.tone]}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">{pillar.label}</span>
                  <span className="block text-xs text-neutral-500">{pillar.description}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
