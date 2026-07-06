"use client";

import {
  EVENT_DETAIL_MOBILE_BOOKMARK,
  EVENT_DETAIL_MOBILE_BOOKMARK_ACTIVE,
  EVENT_DETAIL_MOBILE_RESERVE,
  EVENT_DETAIL_MOBILE_RESERVE_SOON,
  EVENT_DETAIL_SHARE,
} from "@yunicity/utils";
import { Bookmark, Share2 } from "lucide-react";

type EventMobileDetailActionBarProps = {
  interestedByMe: boolean;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
  onShare: () => void;
};

/** Barre d'action fixe bas détail événement mobile (MOBILE-SORTIR-02). */
export function EventMobileDetailActionBar({
  interestedByMe,
  toggling,
  isAuthenticated,
  onToggleInterest,
  onShare,
}: EventMobileDetailActionBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[var(--z-chrome)] border-t border-neutral-200/90 bg-white/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/90"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <button
          type="button"
          disabled
          title={EVENT_DETAIL_MOBILE_RESERVE_SOON}
          className="min-w-0 flex-1 rounded-full bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white opacity-60"
        >
          {EVENT_DETAIL_MOBILE_RESERVE}
        </button>

        <button
          type="button"
          disabled={!isAuthenticated || toggling}
          onClick={() => {
            if (!isAuthenticated) {
              return;
            }
            onToggleInterest();
          }}
          title={
            !isAuthenticated
              ? "Connectez-vous pour enregistrer"
              : interestedByMe
                ? EVENT_DETAIL_MOBILE_BOOKMARK_ACTIVE
                : EVENT_DETAIL_MOBILE_BOOKMARK
          }
          aria-label={interestedByMe ? EVENT_DETAIL_MOBILE_BOOKMARK_ACTIVE : EVENT_DETAIL_MOBILE_BOOKMARK}
          aria-pressed={interestedByMe}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-50 ${
            interestedByMe
              ? "border-yunicity-primary bg-violet-50 text-yunicity-primary"
              : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          <Bookmark
            className={`h-5 w-5 ${interestedByMe ? "fill-current" : ""}`}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>

        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50"
          aria-label={EVENT_DETAIL_SHARE}
        >
          <Share2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </div>
  );
}
