"use client";

import { YunicityLogo } from "@/components/brand";
import {
  PLACE_DETAIL_MOBILE_BACK,
  PLACE_DETAIL_MOBILE_BOOKMARK,
  PLACE_DETAIL_MOBILE_BOOKMARK_SOON,
  PLACE_DETAIL_MOBILE_SHARE,
} from "@yunicity/utils";
import { ArrowLeft, Bookmark, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

type PlaceMobileDetailHeaderProps = {
  city: string;
  onShare: () => void;
};

/** Header détail lieu mobile (MOBILE-LIEUX-02). */
export function PlaceMobileDetailHeader({ city, onShare }: PlaceMobileDetailHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => router.push(`/places?city=${encodeURIComponent(city)}`)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label={PLACE_DETAIL_MOBILE_BACK}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>

        <YunicityLogo href="/feed" size="sm" priority />

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled
            title={PLACE_DETAIL_MOBILE_BOOKMARK_SOON}
            aria-label={PLACE_DETAIL_MOBILE_BOOKMARK}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-yunicity-primary opacity-45"
          >
            <Bookmark className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
            aria-label={PLACE_DETAIL_MOBILE_SHARE}
          >
            <Share2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
