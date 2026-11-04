"use client";

import {
  TRIBE_DETAIL_MOBILE_BACK,
  TRIBE_DETAIL_MOBILE_BOOKMARK,
  TRIBE_DETAIL_MOBILE_BOOKMARK_SOON,
  TRIBE_DETAIL_HERO_SHARE,
} from "@yunicity/utils";
import { ArrowLeft, Bookmark, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

type TribeDetailMobileHeaderProps = {
  tribeName: string;
  city: string;
  onShare: () => void;
};

export function TribeDetailMobileHeader({ tribeName, city, onShare }: TribeDetailMobileHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => router.push(`/tribes?city=${encodeURIComponent(city)}`)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label={TRIBE_DETAIL_MOBILE_BACK}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>

        <h1 className="truncate text-center text-base font-bold text-neutral-900">{tribeName}</h1>

        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            disabled
            title={TRIBE_DETAIL_MOBILE_BOOKMARK_SOON}
            aria-label={TRIBE_DETAIL_MOBILE_BOOKMARK}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400"
          >
            <Bookmark className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
            aria-label={TRIBE_DETAIL_HERO_SHARE}
          >
            <Share2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
