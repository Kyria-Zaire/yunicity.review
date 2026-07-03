"use client";

import type { VideosPortalSortId, VideosPortalTabId } from "@yunicity/utils";
import {
  VIDEOS_SORT_LABEL,
  VIDEOS_SORT_POPULAR,
  VIDEOS_SORT_RECENT,
  VIDEOS_TAB_ALL,
  VIDEOS_TAB_MINE,
  VIDEOS_TAB_NEW,
  VIDEOS_TAB_SUBSCRIPTIONS,
  VIDEOS_TAB_TRENDING,
} from "@yunicity/utils";
import { ChevronDown } from "lucide-react";

type VideosPortalToolbarProps = {
  tab: VideosPortalTabId;
  sort: VideosPortalSortId;
  onTabChange: (tab: VideosPortalTabId) => void;
  onSortChange: (sort: VideosPortalSortId) => void;
};

const TABS: { id: VideosPortalTabId; label: string }[] = [
  { id: "all", label: VIDEOS_TAB_ALL },
  { id: "trending", label: VIDEOS_TAB_TRENDING },
  { id: "new", label: VIDEOS_TAB_NEW },
  { id: "subscriptions", label: VIDEOS_TAB_SUBSCRIPTIONS },
  { id: "mine", label: VIDEOS_TAB_MINE },
];

const SORT_OPTIONS: { value: VideosPortalSortId; label: string }[] = [
  { value: "recent", label: VIDEOS_SORT_RECENT },
  { value: "popular", label: VIDEOS_SORT_POPULAR },
];

function chipClass(active: boolean): string {
  return `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
    active
      ? "bg-yunicity-primary text-white shadow-sm"
      : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
  }`;
}

export function VideosPortalToolbar({
  tab,
  sort,
  onTabChange,
  onSortChange,
}: VideosPortalToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-pressed={tab === item.id}
              className={chipClass(tab === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="flex shrink-0 items-center gap-2 text-sm text-neutral-600">
          <span className="sr-only">{VIDEOS_SORT_LABEL}</span>
          <span className="relative inline-flex items-center">
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as VideosPortalSortId)}
              className="appearance-none rounded-full border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-neutral-800 shadow-sm focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/20"
              aria-label={VIDEOS_SORT_LABEL}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 h-4 w-4 text-neutral-500"
              aria-hidden
            />
          </span>
        </label>
      </div>
    </div>
  );
}
