"use client";

import { NeighborhoodDetailActionBar } from "@/components/neighborhoods/detail/shared";
import type {
  NeighborhoodDetailDesktopTab,
  NeighborhoodDetailDesktopTabId,
  NeighborhoodDetailDesktopTag,
} from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_DESKTOP_BADGE,
  NEIGHBORHOOD_DETAIL_DESKTOP_EXPLORE_MAP,
  NEIGHBORHOOD_DETAIL_DESKTOP_FOLLOW,
  NEIGHBORHOOD_DETAIL_DESKTOP_FOLLOWING,
  NEIGHBORHOOD_DETAIL_DESKTOP_MORE,
  NEIGHBORHOOD_DETAIL_DESKTOP_SET_HOME,
  NEIGHBORHOOD_DETAIL_DESKTOP_SHARE,
  NEIGHBORHOOD_DETAIL_DESKTOP_VERIFIED,
} from "@yunicity/utils";
import { CheckCircle2 } from "lucide-react";

const TAG_TONES: Record<NeighborhoodDetailDesktopTag["tone"], string> = {
  purple: "bg-violet-50 text-violet-700",
  blue: "bg-sky-50 text-sky-700",
  green: "bg-emerald-50 text-emerald-700",
  peach: "bg-orange-50 text-orange-700",
  indigo: "bg-indigo-50 text-indigo-700",
  slate: "bg-neutral-100 text-neutral-700",
};

type NeighborhoodDetailDesktopIdentityProps = {
  name: string;
  tagline: string;
  tags: NeighborhoodDetailDesktopTag[];
  mapHref: string;
  isFollowing: boolean;
  isHome: boolean;
  tabs: NeighborhoodDetailDesktopTab[];
  activeTabId: NeighborhoodDetailDesktopTabId;
  onSelectTab: (tab: NeighborhoodDetailDesktopTab) => void;
  onToggleFollow: () => void;
  onSetHome: () => void;
  onShare: () => void;
};

export function NeighborhoodDetailDesktopIdentity({
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
}: NeighborhoodDetailDesktopIdentityProps) {
  return (
    <section className="space-y-4" aria-labelledby="nd-desktop-title">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-violet-700">
            {NEIGHBORHOOD_DETAIL_DESKTOP_BADGE}
          </p>
          <h1
            id="nd-desktop-title"
            className="mt-2.5 text-[2rem] font-bold leading-tight tracking-tight text-neutral-950"
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
            <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-neutral-600">{tagline}</p>
          ) : null}
        </div>

        <NeighborhoodDetailActionBar
          mapHref={mapHref}
          exploreLabel={NEIGHBORHOOD_DETAIL_DESKTOP_EXPLORE_MAP}
          followLabel={NEIGHBORHOOD_DETAIL_DESKTOP_FOLLOW}
          followingLabel={NEIGHBORHOOD_DETAIL_DESKTOP_FOLLOWING}
          setHomeLabel={NEIGHBORHOOD_DETAIL_DESKTOP_SET_HOME}
          homeActiveLabel="Mon quartier de vie"
          shareLabel={NEIGHBORHOOD_DETAIL_DESKTOP_SHARE}
          moreLabel={NEIGHBORHOOD_DETAIL_DESKTOP_MORE}
          isFollowing={isFollowing}
          isHome={isHome}
          onToggleFollow={onToggleFollow}
          onSetHome={onSetHome}
          onShare={onShare}
        />
      </div>

      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        {NEIGHBORHOOD_DETAIL_DESKTOP_VERIFIED}
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
              className={`shrink-0 px-4 py-3 text-sm font-semibold transition ${
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
