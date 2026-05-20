"use client";

import type { FeedNeighborhoodSummary } from "@yunicity/types";
import { neighborhoodHref } from "@yunicity/utils";
import Link from "next/link";

export function NeighborhoodBadge({
  summary,
  city,
  className = "",
}: {
  summary: FeedNeighborhoodSummary;
  city: string | null | undefined;
  className?: string;
}) {
  const resolvedCity = city ?? "Reims";
  return (
    <Link
      href={neighborhoodHref(summary.slug, resolvedCity)}
      className={`inline-flex max-w-full items-center rounded-full border border-yunicity-primary/20 bg-yunicity-primary-soft/40 px-2 py-0.5 text-xs font-medium text-yunicity-primary transition hover:border-yunicity-primary/40 ${className}`}
    >
      <span className="truncate">{summary.display_name}</span>
    </Link>
  );
}
