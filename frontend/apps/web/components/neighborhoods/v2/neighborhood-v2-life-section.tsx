"use client";

import type { NeighborhoodDetail } from "@yunicity/types";
import { NEIGHBORHOOD_V2_LIFE_TITLE, listNeighborhoodV2LifeFields } from "@yunicity/utils";

type NeighborhoodV2LifeSectionProps = {
  detail: NeighborhoodDetail;
};

/** Les 6 colonnes 3a — champs vides masqués, jamais de section vide ni de contenu inventé. */
export function NeighborhoodV2LifeSection({ detail }: NeighborhoodV2LifeSectionProps) {
  const fields = listNeighborhoodV2LifeFields(detail);
  if (fields.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">{NEIGHBORHOOD_V2_LIFE_TITLE}</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {field.label}
            </dt>
            <dd className="text-sm leading-relaxed text-neutral-700">{field.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
