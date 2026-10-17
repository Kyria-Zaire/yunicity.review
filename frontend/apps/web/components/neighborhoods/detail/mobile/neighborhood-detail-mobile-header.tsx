"use client";

import { YunicityLogo } from "@/components/brand";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_BACK,
  NEIGHBORHOOD_DETAIL_MOBILE_MORE,
  NEIGHBORHOOD_DETAIL_MOBILE_SHARE,
} from "@yunicity/utils";
import { ArrowLeft, MoreVertical, Share2 } from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailMobileHeaderProps = {
  title: string;
  listHref: string;
  onShare: () => void;
};

export function NeighborhoodDetailMobileHeader({
  title,
  listHref,
  onShare,
}: NeighborhoodDetailMobileHeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Link
          href={listHref}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label={NEIGHBORHOOD_DETAIL_MOBILE_BACK}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <YunicityLogo href="/feed" size="sm" priority />
          <p className="truncate text-sm font-semibold text-neutral-900">{title}</p>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
            aria-label={NEIGHBORHOOD_DETAIL_MOBILE_SHARE}
          >
            <Share2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            disabled
            title="Bientôt"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400"
            aria-label={NEIGHBORHOOD_DETAIL_MOBILE_MORE}
          >
            <MoreVertical className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
