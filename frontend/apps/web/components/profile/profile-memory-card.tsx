"use client";

import type { NeighborhoodContributionMeItem } from "@yunicity/types";
import { buildProfileMemoryCardSections } from "@yunicity/utils";
import Link from "next/link";

type ProfileMemoryCardProps = {
  item: NeighborhoodContributionMeItem;
  city: string;
};

export function ProfileMemoryCard({ item, city }: ProfileMemoryCardProps) {
  const sections = buildProfileMemoryCardSections(item, city);

  return (
    <article className="rounded-xl border border-neutral-100 bg-neutral-50/70 px-4 py-4">
      <Link
        href={sections.neighborhoodHref}
        className="text-sm font-semibold text-neutral-900 hover:text-yunicity-primary hover:underline"
      >
        {sections.neighborhoodName}
      </Link>

      {sections.title ? (
        <p className="mt-2 text-sm font-medium text-neutral-800">{sections.title}</p>
      ) : null}

      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{sections.body}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
            item.status === "approved"
              ? "bg-emerald-100 text-emerald-800"
              : item.status === "pending"
                ? "bg-amber-100 text-amber-900"
                : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {sections.statusBadge}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{sections.statusMessage}</p>

      {sections.dateLabel ? (
        <p className="mt-2 text-xs text-neutral-500">{sections.dateLabel}</p>
      ) : null}
    </article>
  );
}
