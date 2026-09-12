"use client";

import {
  EVENT_DETAIL_DESKTOP_SHARE,
  EVENT_DETAIL_MOBILE_BOOKMARK,
  EVENT_DETAIL_MOBILE_BOOKMARK_ACTIVE,
  EVENT_DETAIL_SHARE_COPIED,
} from "@yunicity/utils";
import { Bookmark, Share2 } from "lucide-react";
import { useState } from "react";

type EventMobileDetailShareSaveProps = {
  eventId: string;
  title: string;
  interestedByMe: boolean;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
};

export function EventMobileDetailShareSave({
  eventId,
  title,
  interestedByMe,
  toggling,
  isAuthenticated,
  onToggleInterest,
}: EventMobileDetailShareSaveProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);

  async function handleShare() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/events/${eventId}` : `/events/${eventId}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(EVENT_DETAIL_SHARE_COPIED);
      window.setTimeout(() => setShareHint(null), 2000);
    } catch {
      setShareHint(null);
    }
  }

  return (
    <div
      className="grid grid-cols-2 divide-x divide-neutral-200 rounded-2xl border border-neutral-200/90 bg-white"
      data-event-mobile-share=""
    >
      <button
        type="button"
        onClick={() => void handleShare()}
        className="inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-neutral-700"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        {shareHint ?? EVENT_DETAIL_DESKTOP_SHARE}
      </button>
      <button
        type="button"
        disabled={toggling || !isAuthenticated}
        onClick={onToggleInterest}
        aria-label={interestedByMe ? EVENT_DETAIL_MOBILE_BOOKMARK_ACTIVE : EVENT_DETAIL_MOBILE_BOOKMARK}
        aria-pressed={interestedByMe}
        className="inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-neutral-700 disabled:opacity-50"
      >
        <Bookmark className={`h-4 w-4 ${interestedByMe ? "fill-current text-yunicity-primary" : ""}`} aria-hidden />
        {interestedByMe ? EVENT_DETAIL_MOBILE_BOOKMARK_ACTIVE : EVENT_DETAIL_MOBILE_BOOKMARK}
      </button>
    </div>
  );
}
