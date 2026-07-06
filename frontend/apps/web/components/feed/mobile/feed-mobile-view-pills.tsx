"use client";

import type { FeedPortalView } from "@yunicity/utils";
import {
  FEED_PORTAL_FILTER,
  FEED_PORTAL_LEFT_NEARBY,
  FEED_PORTAL_LEFT_SUBSCRIPTIONS,
  FEED_PORTAL_TAB_FOR_YOU,
} from "@yunicity/utils";
import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";

type FeedMobileViewPillsProps = {
  activeView: FeedPortalView;
  onViewChange: (view: FeedPortalView) => void;
  filterOpen: boolean;
  onToggleFilter: () => void;
};

const VIEW_PILL: { id: FeedPortalView; label: string } = {
  id: "for_you",
  label: FEED_PORTAL_TAB_FOR_YOU,
};

/** Filtres pills mobile — Pour vous · Abonnements · Près de moi + réglages (MOBILE-REFONDE-01). */
export function FeedMobileViewPills({
  activeView,
  onViewChange,
  filterOpen,
  onToggleFilter,
}: FeedMobileViewPillsProps) {
  const forYouActive = activeView === VIEW_PILL.id;

  return (
    <div className="web-mobile-feed-only flex items-center gap-2">
      <div
        className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Vue du fil"
      >
        <button
          type="button"
          role="tab"
          aria-selected={forYouActive}
          onClick={() => onViewChange(VIEW_PILL.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
            forYouActive
              ? "bg-yunicity-primary text-white shadow-sm"
              : "bg-white text-neutral-800 ring-1 ring-neutral-200/90"
          }`}
        >
          {VIEW_PILL.label}
        </button>
        <Link
          href="/subscriptions"
          role="tab"
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-800 ring-1 ring-neutral-200/90 transition hover:bg-neutral-50"
        >
          {FEED_PORTAL_LEFT_SUBSCRIPTIONS}
        </Link>
        <Link
          href="/map"
          role="tab"
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-800 ring-1 ring-neutral-200/90 transition hover:bg-neutral-50"
        >
          {FEED_PORTAL_LEFT_NEARBY}
        </Link>
      </div>
      <button
        type="button"
        onClick={onToggleFilter}
        aria-expanded={filterOpen}
        aria-label={FEED_PORTAL_FILTER}
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
          filterOpen
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
            : "border-neutral-200/90 bg-white text-neutral-600 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </div>
  );
}
