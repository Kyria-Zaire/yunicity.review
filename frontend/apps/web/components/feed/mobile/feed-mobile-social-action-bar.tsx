"use client";

import type { FeedPost, FeedReportReason } from "@yunicity/types";
import { FEED_ACTION_SHARE, FEED_SHARE_COPIED } from "@yunicity/utils";
import { useState } from "react";

function feedShareUrl(postId: string): string {
  if (typeof window === "undefined") {
    return `/feed?post=${postId}`;
  }
  return `${window.location.origin}/feed?post=${postId}`;
}

function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="h-[20px] w-[20px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M12 20.5s-7-4.5-7-11a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6.5-7 11-7 11z" strokeLinejoin="round" />
    </svg>
  );
}

function IconComment() {
  return (
    <svg className="h-[20px] w-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V7a1.5 1.5 0 0 1 1.5-1.5z" strokeLinejoin="round" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg className="h-[20px] w-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 4v12M8 8l4-4 4 4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg className="h-[20px] w-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-6-3.5-6 3.5v-14a1 1 0 0 1 1-1z" strokeLinejoin="round" />
    </svg>
  );
}

/** Barre d’actions compacte mobile — maquette MOBILE-REFONDE-01. */
export function FeedMobileSocialActionBar({
  post,
  commentsOpen,
  onToggleLike,
  onToggleComments,
  onToggleEventInterest,
}: {
  post: FeedPost;
  commentsOpen: boolean;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onToggleEventInterest?: () => void;
}) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [interestLoading, setInterestLoading] = useState(false);

  const isEvent = post.type === "event" && post.event != null;
  const eventInterested = post.event?.interested_by_me ?? false;
  const showBookmark = isEvent && onToggleEventInterest;

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
    if (!onToggleEventInterest || interestLoading) return;
    setInterestLoading(true);
    try {
      await onToggleEventInterest();
    } finally {
      setInterestLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1" role="toolbar" aria-label="Actions sur la publication">
        <button
          type="button"
          onClick={onToggleLike}
          aria-pressed={post.liked_by_me}
          aria-label={`J’aime${post.like_count > 0 ? `, ${post.like_count}` : ""}`}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold transition ${
            post.liked_by_me ? "text-red-500" : "text-neutral-600"
          }`}
        >
          <IconHeart filled={post.liked_by_me} />
          {post.like_count > 0 ? <span>{post.like_count}</span> : null}
        </button>

        <button
          type="button"
          onClick={onToggleComments}
          aria-pressed={commentsOpen}
          aria-label={`Commentaires${post.comment_count > 0 ? `, ${post.comment_count}` : ""}`}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold transition ${
            commentsOpen ? "text-yunicity-primary" : "text-neutral-600"
          }`}
        >
          <IconComment />
          {post.comment_count > 0 ? <span>{post.comment_count}</span> : null}
        </button>

        <button
          type="button"
          onClick={() => void handleShare()}
          aria-label={FEED_ACTION_SHARE}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold text-neutral-600 transition hover:text-neutral-800"
        >
          <IconShare />
          <span>{FEED_ACTION_SHARE}</span>
        </button>

        {showBookmark ? (
          <button
            type="button"
            disabled={interestLoading}
            onClick={() => void handleEventInterest()}
            aria-pressed={eventInterested}
            aria-label={eventInterested ? "Enregistré" : "Enregistrer"}
            className={`ml-auto inline-flex min-h-9 min-w-9 items-center justify-center rounded-full px-2 transition ${
              eventInterested ? "text-yunicity-primary" : "text-neutral-500"
            }`}
          >
            <IconBookmark />
          </button>
        ) : (
          <span
            className="ml-auto inline-flex min-h-9 min-w-9 items-center justify-center text-neutral-400"
            aria-hidden
          >
            <IconBookmark />
          </span>
        )}
      </div>
      {shareHint ? <p className="text-xs text-neutral-500">{shareHint}</p> : null}
    </div>
  );
}
