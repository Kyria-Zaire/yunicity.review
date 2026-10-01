"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { TribeDetailMediumFeaturedCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_MEDIUM_FEATURED_CHARTER_LINK,
  TRIBE_DETAIL_MEDIUM_FEATURED_PINNED,
  TRIBE_DETAIL_MEDIUM_SAVE,
  TRIBE_DETAIL_MEDIUM_SHARE,
} from "@yunicity/utils";
import { Bookmark, Share2 } from "lucide-react";

type TribeDetailMediumFeaturedProps = {
  card: TribeDetailMediumFeaturedCard;
  onShare: () => void;
  onReadCharter: () => void;
};

export function TribeDetailMediumFeatured({
  card,
  onShare,
  onReadCharter,
}: TribeDetailMediumFeaturedProps) {
  return (
    <article
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5"
      data-tribe-detail-medium-featured=""
    >
      <header className="flex flex-wrap items-center gap-2">
        <ProfileAvatar name={card.authorLabel} size="sm" />
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-neutral-900">{card.authorLabel}</p>
        {card.isPinned ? (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
            {TRIBE_DETAIL_MEDIUM_FEATURED_PINNED}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden />
            {TRIBE_DETAIL_MEDIUM_SHARE}
          </button>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400">
            <Bookmark className="h-3.5 w-3.5" aria-hidden />
            {TRIBE_DETAIL_MEDIUM_SAVE}
          </span>
        </div>
      </header>

      <h3 className="mt-4 text-base font-bold text-neutral-900">{card.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">{card.body}</p>

      <button
        type="button"
        onClick={onReadCharter}
        className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {TRIBE_DETAIL_MEDIUM_FEATURED_CHARTER_LINK}
      </button>
    </article>
  );
}
