"use client";

import { SearchDesktopResultCards } from "@/components/search/desktop/search-desktop-result-cards";
import type { SearchDesktopGroupSection } from "@yunicity/utils";
import {
  CalendarDays,
  ChevronRight,
  MessageSquare,
  Building2,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { SearchGroupKey } from "@yunicity/types";
import type { LucideIcon } from "lucide-react";

const GROUP_ICON: Record<SearchGroupKey, LucideIcon> = {
  events: CalendarDays,
  tribes: Users,
  posts: MessageSquare,
  organizations: Building2,
  offers: Building2,
  users: Users,
  neighborhoods: Building2,
};

const GROUP_ICON_TONE: Record<SearchGroupKey, string> = {
  events: "bg-emerald-100 text-emerald-700",
  tribes: "bg-violet-100 text-violet-700",
  posts: "bg-sky-100 text-sky-700",
  organizations: "bg-orange-100 text-orange-700",
  offers: "bg-amber-100 text-amber-700",
  users: "bg-cyan-100 text-cyan-700",
  neighborhoods: "bg-pink-100 text-pink-700",
};

type SearchDesktopGroupSectionViewProps = {
  section: SearchDesktopGroupSection;
  city: string;
  onLoadMore?: () => void;
  loadingMore?: boolean;
};

export function SearchDesktopGroupSectionView({
  section,
  city,
  onLoadMore,
  loadingMore = false,
}: SearchDesktopGroupSectionViewProps) {
  const Icon = GROUP_ICON[section.key];

  return (
    <section className="space-y-3" aria-labelledby={`search-desktop-group-${section.key}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${GROUP_ICON_TONE[section.key]}`}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <h2 id={`search-desktop-group-${section.key}`} className="text-base font-bold text-neutral-950">
            {section.label}
          </h2>
        </div>
        <Link
          href={section.viewAllHref}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-yunicity-primary transition hover:underline"
        >
          {sectionViewAllLabel(section.key)}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <SearchDesktopResultCards groupKey={section.key} items={section.group.items} city={city} />

      {section.group.has_more && onLoadMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          {loadingMore ? "Chargement…" : "Voir plus"}
        </button>
      ) : null}
    </section>
  );
}

function sectionViewAllLabel(key: SearchGroupKey): string {
  const labels: Record<SearchGroupKey, string> = {
    events: "Voir toutes les sorties",
    tribes: "Voir toutes les tribus",
    posts: "Voir toutes les publications",
    organizations: "Voir toutes les organisations",
    offers: "Voir toutes les offres",
    users: "Voir tous les citoyens",
    neighborhoods: "Voir tous les quartiers",
  };
  return labels[key];
}
