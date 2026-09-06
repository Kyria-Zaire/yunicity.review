"use client";

import type { SearchTypeFilter } from "@yunicity/types";
import { SEARCH_DESKTOP_TYPE_TABS } from "@yunicity/utils";
import {
  Briefcase,
  Building2,
  CalendarDays,
  LayoutGrid,
  MapPin,
  MessageSquare,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SearchDesktopTypeTabsProps = {
  value: SearchTypeFilter;
  onChange: (value: SearchTypeFilter) => void;
};

const TAB_META: Record<
  SearchTypeFilter,
  { icon: LucideIcon; tone: string; activeTone: string }
> = {
  all: {
    icon: LayoutGrid,
    tone: "text-neutral-500",
    activeTone: "text-yunicity-primary",
  },
  event: {
    icon: CalendarDays,
    tone: "text-emerald-600",
    activeTone: "text-emerald-700",
  },
  post: {
    icon: MessageSquare,
    tone: "text-sky-600",
    activeTone: "text-sky-700",
  },
  organization: {
    icon: Building2,
    tone: "text-orange-600",
    activeTone: "text-orange-700",
  },
  offer: {
    icon: Briefcase,
    tone: "text-amber-600",
    activeTone: "text-amber-700",
  },
  tribe: {
    icon: Users,
    tone: "text-violet-600",
    activeTone: "text-violet-700",
  },
  user: {
    icon: User,
    tone: "text-cyan-600",
    activeTone: "text-cyan-700",
  },
  neighborhood: {
    icon: MapPin,
    tone: "text-pink-600",
    activeTone: "text-pink-700",
  },
};

export function SearchDesktopTypeTabs({ value, onChange }: SearchDesktopTypeTabsProps) {
  return (
    <div
      className="flex gap-1 overflow-x-auto border-b border-neutral-200/90 pb-px"
      role="tablist"
      aria-label="Filtrer par type de contenu"
    >
      {SEARCH_DESKTOP_TYPE_TABS.map((tab) => {
        const active = tab.value === value;
        const meta = TAB_META[tab.value];
        const Icon = meta.icon;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? `border-yunicity-primary ${meta.activeTone}`
                : `border-transparent ${meta.tone} hover:text-neutral-900`
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
