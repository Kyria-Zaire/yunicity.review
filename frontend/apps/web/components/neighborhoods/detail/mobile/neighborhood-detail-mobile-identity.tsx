"use client";

import type {
  NeighborhoodDetailMobileTab,
  NeighborhoodDetailMobileTabId,
  NeighborhoodDetailMobileTag,
} from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_BADGE,
  NEIGHBORHOOD_DETAIL_MOBILE_EXPLORE_MAP,
  NEIGHBORHOOD_DETAIL_MOBILE_FOLLOW,
  NEIGHBORHOOD_DETAIL_MOBILE_FOLLOWING,
  NEIGHBORHOOD_DETAIL_MOBILE_SET_HOME,
  NEIGHBORHOOD_DETAIL_MOBILE_VERIFIED,
} from "@yunicity/utils";
import { Bookmark, CheckCircle2, Home, Map } from "lucide-react";
import Link from "next/link";

const TAG_TONES: Record<NeighborhoodDetailMobileTag["tone"], string> = {
  purple: "bg-violet-50 text-violet-700",
  blue: "bg-sky-50 text-sky-700",
  green: "bg-emerald-50 text-emerald-700",
  peach: "bg-orange-50 text-orange-700",
  indigo: "bg-indigo-50 text-indigo-700",
  slate: "bg-neutral-100 text-neutral-700",
};

type NeighborhoodDetailMobileIdentityProps = {
  name: string;
  tagline: string;
  tags: NeighborhoodDetailMobileTag[];
  mapHref: string;
  isFollowing: boolean;
  isHome: boolean;
  tabs: NeighborhoodDetailMobileTab[];
  activeTabId: NeighborhoodDetailMobileTabId;
  onSelectTab: (tab: NeighborhoodDetailMobileTab) => void;
  onToggleFollow: () => void;
  onSetHome: () => void;
};

export function NeighborhoodDetailMobileIdentity({
  name,
  tagline,
  tags,
  mapHref,
  isFollowing,
  isHome,
  tabs,
  activeTabId,
  onSelectTab,
  onToggleFollow,
  onSetHome,
}: NeighborhoodDetailMobileIdentityProps) {
  return (
    <section className="space-y-4" aria-labelledby="nd-mobile-title">
      <div>
        <p className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-violet-700">
          {NEIGHBORHOOD_DETAIL_MOBILE_BADGE}
        </p>
        <h1
          id="nd-mobile-title"
          className="mt-2.5 text-[1.75rem] font-bold leading-tight tracking-tight text-neutral-950"
        >
          {name}
        </h1>
        {tags.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${TAG_TONES[tag.tone]}`}
              >
                {tag.label}
              </li>
            ))}
          </ul>
        ) : null}
        {tagline ? (
          <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">{tagline}</p>
        ) : null}
        <p className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          {NEIGHBORHOOD_DETAIL_MOBILE_VERIFIED}
        </p>
      </div>

      <div className="space-y-2.5">
        <Link
          href={mapHref}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90"
        >
          <Map className="h-4 w-4" aria-hidden />
          {NEIGHBORHOOD_DETAIL_MOBILE_EXPLORE_MAP}
        </Link>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onToggleFollow}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition ${
              isFollowing
                ? "border-yunicity-primary/30 bg-yunicity-primary/5 text-yunicity-primary"
                : "border-yunicity-primary/40 bg-white text-yunicity-primary"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isFollowing ? "fill-current" : ""}`} aria-hidden />
            <span className="truncate">
              {isFollowing ? NEIGHBORHOOD_DETAIL_MOBILE_FOLLOWING : NEIGHBORHOOD_DETAIL_MOBILE_FOLLOW}
            </span>
          </button>
          <button
            type="button"
            onClick={onSetHome}
            disabled={isHome}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition ${
              isHome
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-yunicity-primary/40 bg-white text-yunicity-primary"
            }`}
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            <span className="truncate">
              {isHome ? "Mon quartier" : NEIGHBORHOOD_DETAIL_MOBILE_SET_HOME}
            </span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Sections du quartier"
        className="flex overflow-x-auto border-b border-neutral-200/90 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const active = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`shrink-0 px-3.5 py-2.5 text-sm font-semibold transition ${
                active
                  ? "border-b-2 border-yunicity-primary text-yunicity-primary"
                  : "border-b-2 border-transparent text-neutral-600"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </section>
  );
}
