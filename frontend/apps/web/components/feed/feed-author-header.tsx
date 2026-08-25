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

function metaLine(post: FeedPost): string {
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

/**
 * Identite de l'auteur — arbre UNIQUE (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A).
 *
 * Deux `return` selon `layout` produisaient deux structures et deux identites
 * differentes : le nom affiche en desktop, le handle en mobile. Les deux sont
 * desormais rendus une seule fois ; le CSS decide lequel est mis en avant et si
 * le handle est visible, jamais lequel EXISTE.
 */
function AuthorIdentity({ post }: { post: FeedPost }) {
  return (
    <div className="min-w-0 flex-1">
      <p
        data-feed-publication-identity=""
        className="feed-publication-identity truncate font-semibold text-neutral-900"
      >
        {post.author.display_name}
      </p>
      <p
        data-feed-publication-handle=""
        className="feed-publication-handle truncate text-xs text-neutral-500"
      >
        {authorHandle(post)}
      </p>
      <p
        data-feed-publication-meta=""
        className="feed-publication-meta truncate text-xs text-neutral-500"
      >
        {metaLine(post)}
      </p>
    </div>
  );
}

export function FeedAuthorHeader({
  post,
  currentUserId,
  onReport,
}: {
  post: FeedPost;
  currentUserId: string | null;
  onReport?: (reason: FeedReportReason) => Promise<void>;
}) {
  const profileHref = buildFeedAuthorProfileHref(post.author);
  const identityBlock = (
    <>
      <AuthorAvatar post={post} />
      <AuthorIdentity post={post} />
    </>
  );

  return (
    <header
      data-feed-publication-header=""
      className="feed-publication-header flex items-start gap-3"
    >
      {profileHref ? (
        <Link
          href={profileHref}
          className="feed-publication-identity-link flex min-w-0 flex-1 items-start gap-3 rounded-xl transition hover:bg-neutral-50/80"
        >
          {identityBlock}
        </Link>
      ) : (
        <div
          className="feed-publication-identity-link flex min-w-0 flex-1 items-start gap-3"
        >
          {identityBlock}
        </div>
      )}
      {onReport ? (
        <FeedPostOptionsMenu
          onReport={onReport}
          currentUserId={currentUserId}
          authorUserId={post.author.type === "citizen" ? post.author.id : null}
        />
      ) : null}
    </header>
  );
}
