"use client";

import type { FeedPost, FeedReportReason } from "@yunicity/types";
import {
  FEED_ACTION_SAVED,
  FEED_EVENT_INTEREST_CTA,
  formatEventLocation,
  formatTerritorialLine,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FeedPostOptionsMenu } from "@/components/feed/feed-post-options-menu";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";
import { formatFeedPostEventScheduleBadge } from "@/lib/feed/feed-event-badge";

function IconBookmark({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </svg>
  );
}

export function EventFeedCard({
  post,
  currentUserId,
  onReport,
  onToggleEventInterest,
}: {
  post: FeedPost;
  currentUserId: string | null;
  onReport?: (reason: FeedReportReason) => Promise<void>;
  onToggleEventInterest?: () => Promise<void>;
}) {
  const meta = post.event;
  const [interestLoading, setInterestLoading] = useState(false);

  if (!meta) {
    return null;
  }

  const scheduleBadge = formatFeedPostEventScheduleBadge(meta.starts_at);
  const where =
    formatTerritorialLine(post.neighborhood_summary, post.city, meta.district) ??
    formatEventLocation(meta, post.city);
  const eventHref = `/events/${meta.local_event_id}`;
  const eventInterested = meta.interested_by_me;

  async function handleEventInterest() {
    if (!onToggleEventInterest || interestLoading) return;
    setInterestLoading(true);
    try {
      await onToggleEventInterest();
    } finally {
      setInterestLoading(false);
    }
  }

  return (
    <div data-feed-publication-event="" className="feed-publication-event-editorial -mx-5 -mt-5 sm:-mx-6 sm:-mt-6">
      {post.media_url ? (
        <div className="feed-publication-event-media relative">
          <FeedPublicationMedia mediaUrl={post.media_url} label={post.title ?? undefined} />
          {onReport ? (
            <div className="absolute right-3 top-3 rounded-full bg-white/90 shadow-sm">
              <FeedPostOptionsMenu
                onReport={onReport}
                currentUserId={currentUserId}
                authorUserId={post.author.type === "citizen" ? post.author.id : null}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="feed-publication-event-body space-y-3 px-5 py-4 sm:px-6">
        {scheduleBadge ? (
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
            {scheduleBadge}
          </span>
        ) : null}

        {post.title ? (
          <h3 className="text-lg font-bold leading-snug text-neutral-900">{post.title}</h3>
        ) : null}

        {where ? (
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{where}</span>
          </p>
        ) : null}

        {post.body ? (
          <p className="text-sm leading-relaxed text-neutral-700">{post.body}</p>
        ) : null}

        <div className="feed-publication-event-cta flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={interestLoading}
            onClick={() => void handleEventInterest()}
            aria-pressed={eventInterested}
            data-feed-publication-action="event-interest-primary"
            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              eventInterested
                ? "border-yunicity-primary bg-yunicity-primary-soft text-yunicity-primary"
                : "border-yunicity-primary text-yunicity-primary hover:bg-yunicity-primary-soft"
            }`}
          >
            {eventInterested ? FEED_ACTION_SAVED : FEED_EVENT_INTEREST_CTA}
          </button>
          <Link
            href={eventHref}
            aria-label="Enregistrer l'événement"
            data-feed-publication-action="event-bookmark"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
          >
            <IconBookmark filled={eventInterested} />
          </Link>
        </div>
      </div>
    </div>
  );
}
