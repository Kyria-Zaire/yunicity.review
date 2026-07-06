"use client";

import { YunicityLogo } from "@/components/brand";
import {
  VIDEO_DETAIL_MOBILE_BOOKMARK,
  VIDEO_DETAIL_MOBILE_BOOKMARK_SOON,
  VIDEO_DETAIL_MORE,
} from "@yunicity/utils";
import { ArrowLeft, Bookmark, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

type VideosMobileDetailHeaderProps = {
  onOpenReport: () => void;
};

/** Header page détail vidéo mobile — retour · logo · bookmark · menu (MOBILE-VIDEOS-02). */
export function VideosMobileDetailHeader({ onOpenReport }: VideosMobileDetailHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => router.push("/videos")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label="Retour aux vidéos"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>

        <YunicityLogo href="/feed" size="sm" priority />

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled
            title={VIDEO_DETAIL_MOBILE_BOOKMARK_SOON}
            aria-label={VIDEO_DETAIL_MOBILE_BOOKMARK}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-yunicity-primary opacity-45"
          >
            <Bookmark className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
            aria-label={VIDEO_DETAIL_MORE}
          >
            <MoreVertical className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
