"use client";

import { NeighborhoodDetailActionBar } from "@/components/neighborhoods/detail/shared";
import type {
  NeighborhoodDetailMediumTab,
  NeighborhoodDetailMediumTabId,
  NeighborhoodDetailMediumTag,
} from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_MEDIUM_BADGE,
  NEIGHBORHOOD_DETAIL_MEDIUM_FOLLOW,
  NEIGHBORHOOD_DETAIL_MEDIUM_FOLLOWING,
  NEIGHBORHOOD_DETAIL_MEDIUM_MORE,
  NEIGHBORHOOD_DETAIL_MEDIUM_SET_HOME,
  NEIGHBORHOOD_DETAIL_MEDIUM_SHARE,
  NEIGHBORHOOD_DETAIL_MEDIUM_VERIFIED,
  NEIGHBORHOOD_DETAIL_MEDIUM_EXPLORE_MAP,
} from "@yunicity/utils";
import { CheckCircle2 } from "lucide-react";

const TAG_TONES: Record<NeighborhoodDetailMediumTag["tone"], string> = {
  purple: "bg-violet-50 text-violet-700",
  blue: "bg-sky-50 text-sky-700",
  green: "bg-emerald-50 text-emerald-700",
  peach: "bg-orange-50 text-orange-700",
  indigo: "bg-indigo-50 text-indigo-700",
  slate: "bg-neutral-100 text-neutral-700",
};

type NeighborhoodDetailMediumIdentityProps = {
  name: string;
  tagline: string;
  tags: NeighborhoodDetailMediumTag[];
  mapHref: string;
  isFollowing: boolean;
  isHome: boolean;
  tabs: NeighborhoodDetailMediumTab[];
  activeTabId: NeighborhoodDetailMediumTabId;
  onSelectTab: (tab: NeighborhoodDetailMediumTab) => void;
  onToggleFollow: () => void;
  onSetHome: () => void;
  onShare: () => void;
};

export function NeighborhoodDetailMediumIdentity({
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
  onShare,
}: NeighborhoodDetailMediumIdentityProps) {
  return (
    <section className="space-y-4" aria-labelledby="nd-medium-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-violet-700">
            {NEIGHBORHOOD_DETAIL_MEDIUM_BADGE}
          </p>
          <h1
            id="nd-medium-title"
            className="mt-2.5 text-[1.75rem] font-bold leading-tight tracking-tight text-neutral-950 sm:text-3xl"
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
        </div>

        <NeighborhoodDetailActionBar
          mapHref={mapHref}
          exploreLabel={NEIGHBORHOOD_DETAIL_MEDIUM_EXPLORE_MAP}
          followLabel={NEIGHBORHOOD_DETAIL_MEDIUM_FOLLOW}
          followingLabel={NEIGHBORHOOD_DETAIL_MEDIUM_FOLLOWING}
          setHomeLabel={NEIGHBORHOOD_DETAIL_MEDIUM_SET_HOME}
          homeActiveLabel="Mon quartier de vie"
          shareLabel={NEIGHBORHOOD_DETAIL_MEDIUM_SHARE}
          moreLabel={NEIGHBORHOOD_DETAIL_MEDIUM_MORE}
          isFollowing={isFollowing}
          isHome={isHome}
          onToggleFollow={onToggleFollow}
          onSetHome={onSetHome}
          onShare={onShare}
        />
      </div>

      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        {NEIGHBORHOOD_DETAIL_MEDIUM_VERIFIED}
      </p>

      <nav
        aria-label="Sections du quartier"
        className="flex overflow-x-auto border-b border-neutral-200/90"
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
                  : "border-b-2 border-transparent text-neutral-600 hover:text-neutral-900"
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
