"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { TribeDetailDesktopFeaturedCard } from "@yunicity/utils";
import {
  TRIBE_DETAIL_DESKTOP_FEATURED_CHARTER_LINK,
  TRIBE_DETAIL_DESKTOP_FEATURED_PINNED,
  TRIBE_DETAIL_DESKTOP_FEATURED_TITLE,
  TRIBE_DETAIL_DESKTOP_SAVE,
  TRIBE_DETAIL_DESKTOP_SHARE,
} from "@yunicity/utils";
import { Bookmark, Share2 } from "lucide-react";

type TribeDetailDesktopFeaturedProps = {
  card: TribeDetailDesktopFeaturedCard;
  onShare: () => void;
  onReadCharter: () => void;
};

export function TribeDetailDesktopFeatured({
  card,
  onShare,
  onReadCharter,
}: TribeDetailDesktopFeaturedProps) {
  return (
    <section className="space-y-3" data-tribe-detail-featured="">
      <h2 className="text-base font-bold text-neutral-900">{TRIBE_DETAIL_DESKTOP_FEATURED_TITLE}</h2>
      <article className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <header className="flex flex-wrap items-center gap-2">
          <ProfileAvatar name={card.authorLabel} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-neutral-900">{card.authorLabel}</p>
          </div>
          {card.isPinned ? (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
              {TRIBE_DETAIL_DESKTOP_FEATURED_PINNED}
            </span>
          ) : null}
        </header>

        <h3 className="mt-4 text-base font-bold text-neutral-900">{card.title}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">{card.body}</p>

        <button
          type="button"
          onClick={onReadCharter}
          className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {TRIBE_DETAIL_DESKTOP_FEATURED_CHARTER_LINK}
        </button>

        <footer className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {TRIBE_DETAIL_DESKTOP_SHARE}
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400">
            <Bookmark className="h-4 w-4" aria-hidden />
            {TRIBE_DETAIL_DESKTOP_SAVE}
          </span>
        </footer>
      </article>
    </section>
  );
}
