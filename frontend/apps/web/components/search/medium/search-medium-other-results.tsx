"use client";

import type { SearchGroupKey } from "@yunicity/types";
import { SEARCH_DESKTOP_OTHER_RESULTS } from "@yunicity/utils";
import {
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  MapPin,
  MessageSquare,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const GROUP_ICON = {
  events: CalendarDays,
  organizations: Building2,
  posts: MessageSquare,
  offers: Briefcase,
  tribes: Users,
  users: User,
  neighborhoods: MapPin,
} as const;

const GROUP_TONE = {
  events: "bg-emerald-100 text-emerald-700",
  organizations: "bg-orange-100 text-orange-700",
  posts: "bg-sky-100 text-sky-700",
  offers: "bg-amber-100 text-amber-700",
  tribes: "bg-violet-100 text-violet-700",
  users: "bg-cyan-100 text-cyan-700",
  neighborhoods: "bg-pink-100 text-pink-700",
} as const;

type SearchMediumOtherResultsProps = {
  rows: Array<{
    id: string;
    groupKey: SearchGroupKey;
    label: string;
    subtitle: string;
    href: string;
  }>;
  onSelect: (href: string) => void;
};

export function SearchMediumOtherResults({ rows, onSelect }: SearchMediumOtherResultsProps) {
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3 border-t border-neutral-200/90 pt-6" aria-labelledby="search-medium-other-title">
      <h2 id="search-medium-other-title" className="text-base font-bold text-neutral-950">
        {SEARCH_DESKTOP_OTHER_RESULTS}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3" data-search-medium-other-results="">
        {rows.map((row) => {
          const Icon = GROUP_ICON[row.groupKey] as LucideIcon;
          const tone = GROUP_TONE[row.groupKey];
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onSelect(row.href)}
                className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 text-left transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">{row.label}</span>
                  <span className="block text-xs text-neutral-500">{row.subtitle}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
