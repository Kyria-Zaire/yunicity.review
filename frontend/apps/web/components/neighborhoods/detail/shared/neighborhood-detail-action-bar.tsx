"use client";

import { Bookmark, Home, Map, MoreHorizontal, Share2 } from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailActionBarProps = {
  mapHref: string;
  exploreLabel: string;
  followLabel: string;
  followingLabel: string;
  setHomeLabel: string;
  homeActiveLabel: string;
  shareLabel: string;
  moreLabel: string;
  isFollowing: boolean;
  isHome: boolean;
  onToggleFollow: () => void;
  onSetHome: () => void;
  onShare: () => void;
};

export function NeighborhoodDetailActionBar({
  mapHref,
  exploreLabel,
  followLabel,
  followingLabel,
  setHomeLabel,
  homeActiveLabel,
  shareLabel,
  moreLabel,
  isFollowing,
  isHome,
  onToggleFollow,
  onSetHome,
  onShare,
}: NeighborhoodDetailActionBarProps) {
  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <Link
          href={mapHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90"
        >
          <Map className="h-4 w-4" aria-hidden />
          {exploreLabel}
        </Link>
        <button
          type="button"
          onClick={onToggleFollow}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            isFollowing
              ? "border-yunicity-primary/30 bg-yunicity-primary/5 text-yunicity-primary"
              : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
          }`}
        >
          <Bookmark className={`h-4 w-4 ${isFollowing ? "fill-current" : ""}`} aria-hidden />
          {isFollowing ? followingLabel : followLabel}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSetHome}
          disabled={isHome}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            isHome
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
          }`}
        >
          <Home className="h-4 w-4" aria-hidden />
          {isHome ? homeActiveLabel : setHomeLabel}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-300"
          aria-label={shareLabel}
        >
          <Share2 className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-300"
          aria-label={moreLabel}
          disabled
          title="Bientôt"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
