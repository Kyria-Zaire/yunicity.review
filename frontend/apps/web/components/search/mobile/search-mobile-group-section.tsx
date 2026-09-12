"use client";

import { SearchMobileResultCards } from "@/components/search/mobile/search-mobile-result-cards";
import type { SearchDesktopGroupSection } from "@yunicity/utils";
import {
  Briefcase,
  Building2,
  CalendarDays,
  MapPin,
  MessageSquare,
  User,
  Users,
} from "lucide-react";
import type { SearchGroupKey } from "@yunicity/types";
import type { LucideIcon } from "lucide-react";

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

type SearchMobileGroupSectionProps = {
  section: SearchDesktopGroupSection;
  city: string;
  previewOnly?: boolean;
};

export function SearchMobileGroupSection({
  section,
  city,
  previewOnly = true,
}: SearchMobileGroupSectionProps) {
  const Icon = GROUP_ICON[section.key];
  const items = previewOnly ? section.group.items.slice(0, 1) : section.group.items;

  return (
    <article
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      aria-labelledby={`search-mobile-group-${section.key}`}
      data-search-mobile-group=""
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${GROUP_ICON_TONE[section.key]}`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 id={`search-mobile-group-${section.key}`} className="text-sm font-bold text-neutral-950">
          {section.label}
        </h2>
      </div>

      <SearchMobileResultCards groupKey={section.key} items={items} city={city} />
    </article>
  );
}
