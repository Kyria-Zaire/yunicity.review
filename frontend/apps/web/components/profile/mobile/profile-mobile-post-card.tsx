"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { FeedPost } from "@yunicity/types";
import { formatProfileActivityTimestamp } from "@yunicity/utils";
import { Heart, MessageCircle, MoreVertical } from "lucide-react";

type ProfileMobilePostCardProps = {
  post: FeedPost;
  displayName: string;
  onToggleLike?: () => void;
};

/** Carte publication profil mobile (MOBILE-PROFILE-01). */
export function ProfileMobilePostCard({
  post,
  displayName,
  onToggleLike,
}: ProfileMobilePostCardProps) {
  const timestamp = formatProfileActivityTimestamp(post.created_at);
  const body = post.body?.trim() || post.title?.trim() || "";

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <ProfileAvatar name={displayName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-neutral-900">{displayName}</p>
              <p className="text-xs text-neutral-500">{timestamp}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Options"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400"
            disabled
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className={`mt-3 ${post.media_url ? "flex gap-3" : ""}`}>
          {body ? (
            <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
              {body}
            </p>
          ) : null}
          {post.media_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media_url}
              alt=""
              loading="lazy"
              className="h-24 w-24 shrink-0 rounded-xl object-cover"
            />
          ) : null}
        </div>
      </div>

      <footer className="flex items-center gap-4 border-t border-neutral-100 px-4 py-2.5">
        <button
          type="button"
          onClick={onToggleLike}
          aria-pressed={post.liked_by_me}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
            post.liked_by_me ? "text-red-500" : "text-neutral-600"
          }`}
        >
          <Heart
            className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`}
            aria-hidden
          />
          {post.like_count > 0 ? <span>{post.like_count}</span> : null}
        </button>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600">
          <MessageCircle className="h-4 w-4" aria-hidden />
          {post.comment_count > 0 ? <span>{post.comment_count}</span> : null}
        </span>
      </footer>
    </article>
  );
}
