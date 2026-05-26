"use client";

import type { FeedPost, FeedReportReason } from "@yunicity/types";
import {
  FEED_ACTION_COMMENT,
  FEED_ACTION_EVENT_INTEREST,
  FEED_ACTION_EVENT_VIEW,
  FEED_ACTION_MAP,
  FEED_ACTION_NEIGHBORHOOD,
  FEED_ACTION_OFFER_VIEW,
  FEED_ACTION_REACT,
  FEED_ACTION_SAVED,
  FEED_ACTION_SHARE,
  FEED_SHARE_COPIED,
} from "@yunicity/utils";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { ReportAction } from "@/components/feed/report-action";

function ActionButton({
  label,
  onClick,
  href,
  active = false,
  count,
  disabled = false,
  children,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  count?: number;
  disabled?: boolean;
}) {
  const countLabel = count && count > 0 ? ` (${count})` : "";
  const className = `inline-flex min-h-[36px] min-w-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/50 disabled:cursor-not-allowed disabled:opacity-40 ${
    active
      ? "text-yunicity-primary"
      : "text-neutral-500 hover:bg-yunicity-primary/[0.06] hover:text-yunicity-primary"
  }`;

  const content = (
    <>
      <span className="shrink-0 opacity-90">{children}</span>
      <span className="truncate">
        {label}
        {countLabel}
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className} aria-label={`${label}${countLabel}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`${label}${countLabel}`}
      aria-pressed={active || undefined}
      className={className}
    >
      {content}
    </button>
  );
}

function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 20.5s-7-4.5-7-11a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6.5-7 11-7 11z" strokeLinejoin="round" />
    </svg>
  );
}

function IconComment() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V7a1.5 1.5 0 0 1 1.5-1.5z" strokeLinejoin="round" />
    </svg>
  );
}

function IconBookmark({ filled }: { filled?: boolean }) {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-6-3.5-6 3.5v-14a1 1 0 0 1 1-1z" strokeLinejoin="round" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 4v12M8 8l4-4 4 4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
    </svg>
  );
}

function feedShareUrl(postId: string): string {
  if (typeof window === "undefined") {
    return `/feed?post=${postId}`;
  }
  return `${window.location.origin}/feed?post=${postId}`;
}

/**
 * WEB-HOME-01F — Barre d’actions sous les cartes feed (données API réelles uniquement).
 *
 * Sauvegarder : réservé aux moments (POST /events/{id}/interest) — pas d’endpoint bookmark post.
 */
export function FeedSocialActionBar({
  post,
  commentsOpen,
  onToggleLike,
  onToggleComments,
  onToggleEventInterest,
  onReport,
}: {
  post: FeedPost;
  commentsOpen: boolean;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onToggleEventInterest?: () => void;
  onReport: (reason: FeedReportReason) => Promise<void>;
}) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [interestLoading, setInterestLoading] = useState(false);

  const isEvent = post.type === "event" && post.event != null;
  const eventMeta = post.event;
  const eventInterested = eventMeta?.interested_by_me ?? false;
  const hasLocation = post.location != null;
  const neighborhoodHref = post.neighborhood_summary
    ? `/neighborhoods/${post.neighborhood_summary.slug}${post.city ? `?city=${encodeURIComponent(post.city)}` : ""}`
    : null;

  async function handleShare() {
    const url = feedShareUrl(post.id);
    const title = post.title ?? "Yunicity";
    const text = post.body?.slice(0, 120) ?? undefined;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(FEED_SHARE_COPIED);
      setTimeout(() => setShareHint(null), 2500);
    } catch {
      /* annulation partage */
    }
  }

  async function handleEventInterest() {
    if (!onToggleEventInterest || interestLoading) {
      return;
    }
    setInterestLoading(true);
    try {
      await onToggleEventInterest();
    } finally {
      setInterestLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className="-mx-1 flex flex-wrap items-center gap-0.5 sm:gap-1"
        role="toolbar"
        aria-label="Actions sur la publication"
      >
        <ActionButton
          label={FEED_ACTION_REACT}
          active={post.liked_by_me}
          count={post.like_count}
          onClick={onToggleLike}
        >
          <IconHeart filled={post.liked_by_me} />
        </ActionButton>

        <ActionButton
          label={FEED_ACTION_COMMENT}
          active={commentsOpen}
          count={post.comment_count}
          onClick={onToggleComments}
        >
          <IconComment />
        </ActionButton>

        {isEvent && eventMeta ? (
          <>
            <ActionButton
              label={eventInterested ? FEED_ACTION_SAVED : FEED_ACTION_EVENT_INTEREST}
              active={eventInterested}
              onClick={() => void handleEventInterest()}
              disabled={interestLoading}
            >
              <IconBookmark filled={eventInterested} />
            </ActionButton>
            <ActionButton
              label={FEED_ACTION_EVENT_VIEW}
              href={`/events/${eventMeta.local_event_id}`}
            >
              <IconCalendar />
            </ActionButton>
          </>
        ) : null}

        {post.type === "offer" && post.offer ? (
          <ActionButton label={FEED_ACTION_OFFER_VIEW} href="/passport">
            <IconBookmark />
          </ActionButton>
        ) : null}

        {neighborhoodHref ? (
          <ActionButton label={FEED_ACTION_NEIGHBORHOOD} href={neighborhoodHref}>
            <IconMap />
          </ActionButton>
        ) : null}

        {(isEvent || hasLocation) && (
          <ActionButton label={FEED_ACTION_MAP} href="/map">
            <IconMap />
          </ActionButton>
        )}

        <ActionButton label={FEED_ACTION_SHARE} onClick={() => void handleShare()}>
          <IconShare />
        </ActionButton>

        <div className="ml-auto flex items-center pl-1">
          <ReportAction onReport={onReport} />
        </div>
      </div>

      {shareHint ? <p className="text-xs text-neutral-500">{shareHint}</p> : null}
    </div>
  );
}
