"use client";

import type { NeighborhoodContributionMeItem } from "@yunicity/types";
import {
  PROFILE_DESKTOP_CONTRIB_APPROVED,
  PROFILE_DESKTOP_CONTRIB_EMPTY,
  PROFILE_DESKTOP_PUBLIC_CONTRIB_CTA,
  PROFILE_DESKTOP_PUBLIC_CONTRIB_TITLE,
  formatNeighborhoodContributionDate,
} from "@yunicity/utils";
import { Building2, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";

type ProfileDesktopContributionsProps = {
  items: NeighborhoodContributionMeItem[];
  loading?: boolean;
  onViewAll?: () => void;
  maxItems?: number;
};

function contributionTitle(item: NeighborhoodContributionMeItem): string {
  return (
    item.title?.trim() ||
    item.neighborhood.display_name?.trim() ||
    item.body.slice(0, 48).trim() ||
    "Contribution"
  );
}

function contributionSubtitle(item: NeighborhoodContributionMeItem): string {
  const trimmed = item.body.trim();
  if (trimmed.length <= 64) return trimmed;
  return `${trimmed.slice(0, 61)}…`;
}

/** Colonne contributions publiques — maquette profil public desktop. */
export function ProfileDesktopContributions({
  items,
  loading = false,
  onViewAll,
  maxItems = 4,
}: ProfileDesktopContributionsProps) {
  const visible = items.filter((item) => item.status === "approved").slice(0, maxItems);

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
      data-profile-desktop-contributions=""
    >
      <h2 className="text-base font-bold text-neutral-900">{PROFILE_DESKTOP_PUBLIC_CONTRIB_TITLE}</h2>

      {loading ? (
        <p className="mt-4 text-sm text-neutral-500" role="status">
          Chargement…
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-neutral-500">{PROFILE_DESKTOP_CONTRIB_EMPTY}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {visible.map((item, index) => {
            const Icon = index % 2 === 0 ? Building2 : Tag;
            const iconClass =
              index % 2 === 0 ? "bg-violet-100 text-violet-700" : "bg-orange-100 text-orange-700";
            const dateLabel = formatNeighborhoodContributionDate(
              item.approved_at ?? item.submitted_at,
            );

            return (
              <li key={item.id} className="flex gap-3">
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-neutral-900">{contributionTitle(item)}</p>
                    {dateLabel ? (
                      <time className="shrink-0 text-xs text-neutral-400">{dateLabel}</time>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                    {contributionSubtitle(item)}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {PROFILE_DESKTOP_CONTRIB_APPROVED}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {onViewAll && visible.length > 0 ? (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PROFILE_DESKTOP_PUBLIC_CONTRIB_CTA}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : (
        <Link
          href="/neighborhoods"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PROFILE_DESKTOP_PUBLIC_CONTRIB_CTA}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </section>
  );
}
