"use client";

import Link from "next/link";

type SortirEmptyStateProps = {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function SortirEmptyState({ message, ctaLabel, ctaHref }: SortirEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-6 text-center">
      <p className="text-sm leading-relaxed text-neutral-600">{message}</p>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
