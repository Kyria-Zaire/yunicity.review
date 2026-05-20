import type { FeedPost } from "@yunicity/types";
import {
  EVENT_FEED_BADGE,
  eventTypeLabel,
  formatEventDateRange,
  formatEventLocation,
} from "@yunicity/utils";
import Link from "next/link";

import { FeedAuthorHeader } from "@/components/feed/feed-author-header";

export function EventFeedCard({ post }: { post: FeedPost }) {
  const meta = post.event;
  if (!meta) {
    return null;
  }
  const typeLabel = eventTypeLabel(meta.event_type);
  const when = formatEventDateRange(meta.starts_at, meta.ends_at);
  const where = formatEventLocation(meta, post.city);

  return (
    <div className="-m-6 mb-0 rounded-t-2xl border-b border-neutral-100 bg-white p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-yunicity-primary/10 px-2.5 py-0.5 text-xs font-semibold text-yunicity-primary">
          {EVENT_FEED_BADGE}
        </span>
        {typeLabel ? <span className="text-xs text-neutral-500">{typeLabel}</span> : null}
      </div>
      <FeedAuthorHeader post={post} />
      {post.title ? (
        <h3 className="mt-3 text-base font-semibold text-neutral-900">{post.title}</h3>
      ) : null}
      {post.body ? (
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">{post.body}</p>
      ) : null}
      <p className="mt-3 text-sm text-neutral-600">{when}</p>
      <p className="text-sm text-neutral-500">{where}</p>
      <Link
        href={`/events/${meta.local_event_id}`}
        className="mt-4 inline-flex text-sm font-medium text-yunicity-primary underline-offset-2 hover:underline"
      >
        Découvrir ce moment
      </Link>
    </div>
  );
}
