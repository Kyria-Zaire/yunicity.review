"use client";

import type { FeedPost, FeedReportReason } from "@yunicity/types";
import { authorInitials, buildFeedAuthorProfileHref, formatFeedRelativeTime } from "@yunicity/utils";

import { FeedPostOptionsMenu } from "@/components/feed/feed-post-options-menu";
import Link from "next/link";

function authorHandle(post: FeedPost): string {
  const { author } = post;
  if (author.username?.trim()) {
    return `@${author.username.trim()}`;
  }
  const slug = author.display_name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
  return slug ? `@${slug}` : author.display_name;
}

function mobileMetaLine(post: FeedPost): string {
  const neighborhood = post.neighborhood_summary?.display_name?.trim();
  const city = post.city?.trim();
  const time = formatFeedRelativeTime(post.created_at);

  if (neighborhood && city) {
    return `${neighborhood}, ${city} • ${time}`;
  }
  if (neighborhood) {
    return `${neighborhood} • ${time}`;
  }
  if (city) {
    return `${city} • ${time}`;
  }
  return time;
}

function AuthorAvatar({ post }: { post: FeedPost }) {
  const { author } = post;

  if (author.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={author.logo_url}
        alt=""
        loading="lazy"
        decoding="async"
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full border border-neutral-200/80 object-cover"
      />
    );
  }

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-semibold text-yunicity-primary"
      aria-hidden
    >
      {authorInitials(author.display_name)}
    </span>
  );
}

function AuthorIdentity({
  post,
  layout,
}: {
  post: FeedPost;
  layout: "default" | "mobile";
}) {
  if (layout === "mobile") {
    return (
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-neutral-900">{authorHandle(post)}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{mobileMetaLine(post)}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-neutral-900">{post.author.display_name}</p>
      <p className="text-xs text-neutral-500">
        {formatFeedRelativeTime(post.created_at)}
        {post.neighborhood_summary?.display_name
          ? ` · ${post.neighborhood_summary.display_name}`
          : post.city
            ? ` · ${post.city}`
            : ""}
      </p>
    </div>
  );
}

export function FeedAuthorHeader({
  post,
  layout = "default",
  onReport,
}: {
  post: FeedPost;
  layout?: "default" | "mobile";
  onReport?: (reason: FeedReportReason) => Promise<void>;
}) {
  const profileHref = buildFeedAuthorProfileHref(post.author);
  const identityBlock = (
    <>
      <AuthorAvatar post={post} />
      <AuthorIdentity post={post} layout={layout} />
    </>
  );

  return (
    <header className={`flex items-start gap-3 ${layout === "default" ? "items-center" : ""}`}>
      {profileHref ? (
        <Link
          href={profileHref}
          className={`flex min-w-0 flex-1 items-start gap-3 rounded-xl transition hover:bg-neutral-50/80 ${
            layout === "default" ? "items-center" : ""
          }`}
        >
          {identityBlock}
        </Link>
      ) : (
        <div
          className={`flex min-w-0 flex-1 items-start gap-3 ${
            layout === "default" ? "items-center" : ""
          }`}
        >
          {identityBlock}
        </div>
      )}
      {onReport ? <FeedPostOptionsMenu onReport={onReport} /> : null}
    </header>
  );
}
