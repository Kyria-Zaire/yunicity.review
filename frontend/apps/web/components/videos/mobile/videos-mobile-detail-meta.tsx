"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEO_DETAIL_COMMENT,
  VIDEO_DETAIL_FOLLOW,
  VIDEO_DETAIL_FOLLOW_SOON,
  VIDEO_DETAIL_LIKE,
  VIDEO_DETAIL_SHARE,
  buildVideoDetailMobileTags,
  formatVideoAuthorDisplayName,
  formatVideoAuthorHandle,
  formatVideoDetailMobileMetaLine,
  resolveVideoDetailTitle,
} from "@yunicity/utils";
import { Heart, MessageCircle, SendHorizontal, Share2 } from "lucide-react";

type VideosMobileDetailMetaProps = {
  item: LocalVideoFeedItem;
  onToggleLike: () => void;
  onShare: () => void;
  onOpenComments: () => void;
};

function authorInitials(item: LocalVideoFeedItem): string {
  const name = item.author.full_name?.trim() || item.author.username || "YU";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function ActionColumn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 border-r border-neutral-200 px-1 py-2 text-xs font-semibold last:border-r-0 ${
        active ? "text-yunicity-primary" : "text-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

/** Métadonnées mobile — titre, tags, créateur, actions, description (MOBILE-VIDEOS-02). */
export function VideosMobileDetailMeta({
  item,
  onToggleLike,
  onShare,
  onOpenComments,
}: VideosMobileDetailMetaProps) {
  const title = resolveVideoDetailTitle(item);
  const tags = buildVideoDetailMobileTags(item);
  const displayName = formatVideoAuthorDisplayName(item);
  const handle = formatVideoAuthorHandle(item);

  return (
    <section className="space-y-4">
      <div className="space-y-2.5">
        <h1 className="text-lg font-bold leading-snug tracking-tight text-neutral-900">{title}</h1>
        {tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-yunicity-primary-soft px-3 py-1 text-xs font-semibold text-yunicity-primary"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {item.author.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.author.avatar_url}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-sm font-bold text-white">
            {authorInitials(item)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-neutral-900">{displayName}</p>
          <p className="truncate text-xs text-neutral-500">{handle}</p>
        </div>
        <button
          type="button"
          disabled
          title={VIDEO_DETAIL_FOLLOW_SOON}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white opacity-80"
        >
          {VIDEO_DETAIL_FOLLOW}
        </button>
      </div>

      <div
        className="flex overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
        role="toolbar"
        aria-label="Actions sur la vidéo"
      >
        <ActionColumn
          label={`${VIDEO_DETAIL_LIKE}${item.like_count > 0 ? `, ${item.like_count}` : ""}`}
          active={item.liked_by_me}
          onClick={onToggleLike}
        >
          <Heart
            className={`h-5 w-5 ${item.liked_by_me ? "fill-yunicity-primary text-yunicity-primary" : ""}`}
            strokeWidth={1.75}
            aria-hidden
          />
          <span>{item.like_count}</span>
        </ActionColumn>

        <ActionColumn
          label={`${VIDEO_DETAIL_COMMENT}${item.comment_count > 0 ? `, ${item.comment_count}` : ""}`}
          onClick={onOpenComments}
        >
          <MessageCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          <span>{item.comment_count}</span>
        </ActionColumn>

        <ActionColumn label="Envoyer" onClick={onShare}>
          <SendHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </ActionColumn>

        <ActionColumn label={VIDEO_DETAIL_SHARE} onClick={onShare}>
          <Share2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          <span className="text-[11px]">{VIDEO_DETAIL_SHARE}</span>
        </ActionColumn>
      </div>

      {item.description?.trim() ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-800">{item.description}</p>
      ) : null}

      <p className="text-xs text-neutral-500">{formatVideoDetailMobileMetaLine(item)}</p>
    </section>
  );
}
