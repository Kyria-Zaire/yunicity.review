"use client";

import { SearchDesktopResultCards } from "@/components/search/desktop/search-desktop-result-cards";
import type { SearchDesktopGroupSection } from "@yunicity/utils";
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
import type { SearchGroupKey } from "@yunicity/types";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

const GROUP_ICON: Record<SearchGroupKey, LucideIcon> = {
  events: CalendarDays,
  tribes: Users,
  posts: MessageSquare,
  organizations: Building2,
  offers: Briefcase,
  users: User,
  neighborhoods: MapPin,
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

type SearchMediumGroupCardProps = {
  section: SearchDesktopGroupSection;
  city: string;
};

export function SearchMediumGroupCard({ section, city }: SearchMediumGroupCardProps) {
  const Icon = GROUP_ICON[section.key];
  const previewItems = section.group.items.slice(0, 1);

  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      aria-labelledby={`search-medium-group-${section.key}`}
      data-search-medium-group-card=""
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${GROUP_ICON_TONE[section.key]}`}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <h2 id={`search-medium-group-${section.key}`} className="text-sm font-bold text-neutral-950">
            {section.label}
          </h2>
        </div>
        <Link
          href={section.viewAllHref}
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-yunicity-primary transition hover:underline"
        >
          {sectionViewAllShort(section.key)}
          <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <div className="mt-3 min-h-0 flex-1">
        <SearchDesktopResultCards groupKey={section.key} items={previewItems} city={city} />
      </div>
    </article>
  );
}

function sectionViewAllShort(key: SearchGroupKey): string {
  const labels: Record<SearchGroupKey, string> = {
    events: "Voir la sortie",
    tribes: "Voir la tribu",
    posts: "Voir plus",
    organizations: "Voir le profil",
    offers: "Voir l'offre",
    users: "Voir le profil",
    neighborhoods: "Voir le quartier",
  };
  return labels[key];
}
