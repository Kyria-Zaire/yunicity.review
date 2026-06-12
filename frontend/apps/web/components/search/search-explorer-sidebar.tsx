"use client";

import type { ExplorerCategoryId } from "@yunicity/utils";
import {
  EXPLORER_NAV_CATEGORIES,
  SEARCH_EXPLORER_SIDEBAR_SUBTITLE,
  SEARCH_EXPLORER_SIDEBAR_TITLE,
  SEARCH_EXPLORER_TRENDS_CTA,
  SEARCH_EXPLORER_SIDEBAR_TRENDS_TITLE,
  type ExplorerTrendLine,
} from "@yunicity/utils";
import {
  Activity,
  ShoppingBag,
  Calendar,
  Compass,
  Grid3x3,
  Landmark,
  Leaf,
  Music,
  Palette,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  grid: Grid3x3,
  palette: Palette,
  leaf: Leaf,
  utensils: Utensils,
  activity: Activity,
  music: Music,
  calendar: Calendar,
  landmark: Landmark,
  sparkles: Sparkles,
  bag: ShoppingBag,
};

type SearchExplorerSidebarProps = {
  activeCategory: ExplorerCategoryId;
  onCategoryChange: (id: ExplorerCategoryId) => void;
  trends: ExplorerTrendLine[];
  city: string;
};

export function SearchExplorerSidebar({
  activeCategory,
  onCategoryChange,
  trends,
  city,
}: SearchExplorerSidebarProps) {
  return (
    <aside className="hidden lg:block lg:w-[15rem] lg:shrink-0 xl:w-[16rem]">
      <div className="sticky top-24 space-y-5">
        <div className="rounded-2xl border border-yunicity-primary/15 bg-yunicity-primary-soft px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yunicity-primary text-white">
              <Compass className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-900">{SEARCH_EXPLORER_SIDEBAR_TITLE}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                {SEARCH_EXPLORER_SIDEBAR_SUBTITLE}
              </p>
            </div>
          </div>
        </div>

        <nav aria-label="Catégories Explorer">
          <ul className="space-y-0.5">
            {EXPLORER_NAV_CATEGORIES.map((item) => {
              const Icon = ICONS[item.icon] ?? Grid3x3;
              const active = activeCategory === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onCategoryChange(item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      active
                        ? "bg-yunicity-primary text-white shadow-sm"
                        : "text-neutral-700 hover:bg-white hover:text-neutral-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {trends.length > 0 ? (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-4">
            <div className="flex items-center gap-2 text-violet-900">
              <TrendingUp className="h-4 w-4" aria-hidden />
              <p className="text-sm font-bold">{SEARCH_EXPLORER_SIDEBAR_TRENDS_TITLE}</p>
            </div>
            <ul className="mt-3 space-y-2">
              {trends.map((trend) => (
                <li key={trend.id}>
                  <Link
                    href={trend.href}
                    className="group flex items-start gap-2 text-xs text-violet-900/90 hover:text-violet-950"
                  >
                    <span className="mt-0.5 text-violet-500" aria-hidden>
                      ↗
                    </span>
                    <span className="line-clamp-2 group-hover:underline">{trend.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={`/sortir?city=${encodeURIComponent(city)}`}
              className="mt-3 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
            >
              {SEARCH_EXPLORER_TRENDS_CTA}
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
