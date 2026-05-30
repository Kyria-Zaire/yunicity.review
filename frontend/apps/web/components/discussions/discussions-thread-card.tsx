"use client";

import type { DiscussionThread, FeedPost, FeedReportReason } from "@yunicity/types";
import {
  discussionTagTone,
  formatDiscussionActivityAgo,
} from "@yunicity/utils";
import { Heart, MessageCircle } from "lucide-react";

import { FeedCard } from "@/components/feed/feed-card";
import { NeighborhoodBadge } from "@/components/neighborhoods/neighborhood-badge";

type DiscussionsThreadCardProps = {
  thread: DiscussionThread;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleLike: (post: FeedPost) => Promise<void>;
  onReport: (postId: string, reason: FeedReportReason) => Promise<void>;
};

function ParticipantStack({ thread }: { thread: DiscussionThread }) {
  const { participants, participants_overflow: overflow } = thread;
  if (participants.length === 0 && overflow === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {participants.map((p) => (
          <span
            key={p.display_name}
            title={p.display_name}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-yunicity-primary-soft text-[10px] font-bold text-yunicity-primary"
          >
            {p.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              p.display_name.slice(0, 1)
            )}
          </span>
        ))}
      </div>
      {overflow > 0 ? (
        <span className="ml-1 text-xs font-medium text-neutral-500">+{overflow}</span>
      ) : null}
    </div>
  );
}

export function DiscussionsThreadCard({
  thread,
  expanded,
  onToggleExpand,
  onToggleLike,
  onReport,
}: DiscussionsThreadCardProps) {
  const timeLabel = formatDiscussionActivityAgo(thread.last_activity_at ?? thread.created_at);
  const location = thread.neighborhood_summary?.display_name ?? thread.city;

  return (
    <article
      id={`thread-${thread.id}`}
      className="scroll-mt-28 rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
    >
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="hidden shrink-0 sm:block">
          {thread.author.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thread.author.logo_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary">
              {thread.author.display_name.slice(0, 1)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{thread.author.display_name}</p>
              <p className="text-xs text-neutral-500">
                {timeLabel}
                {location ? ` · ${location}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-sm text-neutral-600">
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-4 w-4" aria-hidden />
                {thread.comment_count}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-4 w-4" aria-hidden />
                {thread.like_count}
              </span>
            </div>
          </div>

          <button type="button" onClick={onToggleExpand} className="mt-3 w-full text-left">
            <h3 className="text-base font-bold leading-snug text-neutral-900 sm:text-lg">
              {thread.discussion_title}
            </h3>
            {thread.excerpt ? (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                {thread.excerpt}
              </p>
            ) : null}
          </button>

          {thread.media_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thread.media_url}
              alt=""
              className="mt-3 max-h-48 w-full rounded-xl object-cover"
            />
          ) : null}

          {thread.category_labels.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {thread.category_ids.slice(0, 3).map((catId, index) => (
                <span
                  key={catId}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${discussionTagTone(catId)}`}
                >
                  {thread.category_labels[index]}
                </span>
              ))}
              {thread.neighborhood_summary ? (
                <NeighborhoodBadge summary={thread.neighborhood_summary} city={thread.city} />
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <ParticipantStack thread={thread} />
            <button
              type="button"
              onClick={onToggleExpand}
              className="text-xs font-semibold text-yunicity-primary hover:underline"
            >
              {expanded ? "Réduire" : "Voir la discussion"}
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-neutral-100 p-4 sm:p-5">
          <FeedCard
            post={thread}
            onToggleLike={(p) => onToggleLike(p)}
            onReport={onReport}
          />
        </div>
      ) : null}
    </article>
  );
}
