"use client";

import type { StoryTabId } from "@yunicity/types";
import { STORIES_FILTER, STORY_TAB_OPTIONS } from "@yunicity/utils";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

type StoriesViewTabsProps = {
  activeTab: StoryTabId;
  onTabChange: (tab: StoryTabId) => void;
  filterOpen: boolean;
  onToggleFilter: () => void;
};

export function StoriesViewTabs({
  activeTab,
  onTabChange,
  filterOpen,
  onToggleFilter,
}: StoriesViewTabsProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-neutral-200/90 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Filtrer les stories">
        {STORY_TAB_OPTIONS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className={`relative shrink-0 px-3 py-3 text-sm font-medium transition ${
                active ? "text-yunicity-primary" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {tab.label}
              {active ? (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-yunicity-primary"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onToggleFilter}
        aria-expanded={filterOpen}
        className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 sm:self-auto"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        {STORIES_FILTER}
        <ChevronDown className={`h-4 w-4 transition ${filterOpen ? "rotate-180" : ""}`} aria-hidden />
      </button>
    </div>
  );
}
