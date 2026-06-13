"use client";

import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_V2_SHARE_MEMORY_CTA,
  NEIGHBORHOOD_V2_SHARE_MEMORY_SOON,
  formatNeighborhoodV2ContributionsTitle,
} from "@yunicity/utils";

type NeighborhoodV2BelongingSectionProps = {
  detail: NeighborhoodDetail;
};

export function NeighborhoodV2BelongingSection({ detail }: NeighborhoodV2BelongingSectionProps) {
  const contributions = detail.contributions.slice(0, 3);

  if (contributions.length === 0) {
    return null;
  }

  const displayName = detail.hero?.display_name ?? detail.display_name;

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">
        {formatNeighborhoodV2ContributionsTitle(displayName)}
      </h2>

      <ul className="mt-4 space-y-3">
        {contributions.map((contribution) => (
          <li key={contribution.id}>
            <article className="rounded-xl border border-neutral-100 bg-neutral-50/70 px-4 py-4">
              {contribution.title?.trim() ? (
                <p className="text-sm font-bold text-neutral-900">{contribution.title}</p>
              ) : null}
              <p className="mt-1 text-sm leading-relaxed text-neutral-700">{contribution.body}</p>
            </article>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="cursor-not-allowed rounded-full border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-400"
        >
          {NEIGHBORHOOD_V2_SHARE_MEMORY_CTA}
        </button>
        <span className="rounded-full bg-neutral-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-600">
          {NEIGHBORHOOD_V2_SHARE_MEMORY_SOON}
        </span>
      </div>
    </section>
  );
}
