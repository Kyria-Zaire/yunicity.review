import type { FeedPost } from "@yunicity/types";
import { authorInitials, formatFeedRelativeTime } from "@yunicity/utils";

export function FeedAuthorHeader({ post }: { post: FeedPost }) {
  const { author } = post;
  return (
    <header className="flex items-center gap-3">
      {author.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.logo_url}
          alt=""
          className="h-10 w-10 rounded-full border border-yunicity-border object-cover"
        />
      ) : (
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-semibold text-yunicity-primary"
          aria-hidden
        >
          {authorInitials(author.display_name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900">{author.display_name}</p>
        <p className="text-xs text-neutral-500">
          {formatFeedRelativeTime(post.created_at)}
          {post.neighborhood_summary?.display_name
            ? ` · ${post.neighborhood_summary.display_name}`
            : post.city
              ? ` · ${post.city}`
              : ""}
        </p>
      </div>
    </header>
  );
}
