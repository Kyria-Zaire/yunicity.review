"use client";

import type { NeighborhoodDetailContributionItem } from "@yunicity/types";
import { buildContributionCardSections } from "@yunicity/utils";

type NeighborhoodContributionCardProps = {
  contribution: NeighborhoodDetailContributionItem;
};

export function NeighborhoodContributionCard({ contribution }: NeighborhoodContributionCardProps) {
  const sections = buildContributionCardSections(contribution);

  return (
    <article className="rounded-xl border border-neutral-100 bg-neutral-50/70 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {sections.identity}
      </p>

      {sections.title ? (
        <p className="mt-2 text-sm font-medium text-neutral-800">{sections.title}</p>
      ) : null}

      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{sections.body}</p>

      {sections.dateLabel ? (
        <p className="mt-3 text-xs text-neutral-500">{sections.dateLabel}</p>
      ) : null}
    </article>
  );
}
