"use client";

import type { FeedPortalView } from "@yunicity/utils";
import {
  FEED_PORTAL_FILTER,
  FEED_PORTAL_TAB_FOR_YOU,
  FEED_PORTAL_TAB_POPULAR,
  FEED_PORTAL_TAB_RECENT,
} from "@yunicity/utils";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

const TABS: { id: FeedPortalView; label: string }[] = [
  { id: "for_you", label: FEED_PORTAL_TAB_FOR_YOU },
  { id: "recent", label: FEED_PORTAL_TAB_RECENT },
  { id: "popular", label: FEED_PORTAL_TAB_POPULAR },
];

type FeedViewTabsProps = {
  activeView: FeedPortalView;
  onViewChange: (view: FeedPortalView) => void;
  filterOpen: boolean;
  onToggleFilter: () => void;
};

export function FeedViewTabs({
  activeView,
  onViewChange,
  filterOpen,
  onToggleFilter,
}: FeedViewTabsProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-200/90 pb-0">
      <div className="flex min-w-0 gap-1 overflow-x-auto" role="tablist" aria-label="Vue du fil">
        {TABS.map((tab) => {
          const active = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onViewChange(tab.id)}
              className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition ${
                active ? "text-yunicity-primary" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                {tab.label}
                {active && tab.id === "for_you" ? (
                  <ChevronDown className="h-4 w-4 opacity-80" aria-hidden />
                ) : null}
              </span>
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-yunicity-primary" />
              ) : null}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onToggleFilter}
        aria-expanded={filterOpen}
        className={`mb-2 inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
          filterOpen
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        {FEED_PORTAL_FILTER}
      </button>
    </div>
  );
}
