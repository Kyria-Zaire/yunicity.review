"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { FeedPost } from "@yunicity/types";
import { formatProfileActivityTimestamp } from "@yunicity/utils";
import { Bookmark, Heart, MessageCircle } from "lucide-react";

type TribeDetailMobilePostCardProps = {
  post: FeedPost;
  onToggleLike?: () => void;
};

/** Carte publication tribu mobile (MOBILE-TRIBE-DETAIL-01). */
export function TribeDetailMobilePostCard({ post, onToggleLike }: TribeDetailMobilePostCardProps) {
  const authorLabel =
    post.author.display_name?.trim() || post.author.username?.trim() || "Membre";
  const body = post.body?.trim() || post.title?.trim() || "";
  const timestamp = formatProfileActivityTimestamp(post.created_at);

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start gap-2.5">
          <ProfileAvatar name={authorLabel} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-neutral-900">{authorLabel}</p>
            <p className="text-xs text-neutral-500">{timestamp}</p>
          </div>
        </div>

        {body ? (
          <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-snug text-neutral-900">
            {body}
          </p>
        ) : null}

        {post.media_url ? (
          <div className="relative mt-3 overflow-hidden rounded-xl bg-neutral-100">
            <CulturalImage
              src={post.media_url}
              alt=""
              placeName={authorLabel}
              className="max-h-52 w-full object-cover"
              sizes="100vw"
              showFallbackCaption={false}
              overlay={false}
            />
          </div>
        ) : null}
      </div>

      <footer className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleLike}
            aria-pressed={post.liked_by_me}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
              post.liked_by_me ? "text-red-500" : "text-neutral-600"
            }`}
          >
            <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} aria-hidden />
            {post.like_count > 0 ? <span>{post.like_count}</span> : null}
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600">
            <MessageCircle className="h-4 w-4" aria-hidden />
            {post.comment_count > 0 ? <span>{post.comment_count}</span> : null}
          </span>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-300">
          <Bookmark className="h-4 w-4" aria-hidden />
        </span>
      </footer>
    </article>
  );
}
