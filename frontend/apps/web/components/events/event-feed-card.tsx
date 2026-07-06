import type { FeedPost, FeedReportReason } from "@yunicity/types";
import {
  EVENT_FEED_BADGE,
  eventTypeLabel,
  formatEventDateRange,
  formatEventLocation,
  formatTerritorialLine,
} from "@yunicity/utils";

import { FeedAuthorHeader } from "@/components/feed/feed-author-header";
import { FeedMobileMedia } from "@/components/feed/mobile/feed-mobile-media";
import { NeighborhoodBadge } from "@/components/neighborhoods/neighborhood-badge";

export function EventFeedCard({
  post,
  layout = "default",
  onReport,
}: {
  post: FeedPost;
  layout?: "default" | "mobile";
  onReport?: (reason: FeedReportReason) => Promise<void>;
}) {
  const meta = post.event;
  if (!meta) {
    return null;
  }
  const isMobile = layout === "mobile";
  const typeLabel = eventTypeLabel(meta.event_type);
  const when = formatEventDateRange(meta.starts_at, meta.ends_at);
  const where =
    formatTerritorialLine(post.neighborhood_summary, post.city, meta.district) ??
    formatEventLocation(meta, post.city);

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-yunicity-primary px-2.5 py-0.5 text-xs font-semibold text-white">
            {EVENT_FEED_BADGE}
          </span>
          {typeLabel ? <span className="text-xs font-medium text-neutral-500">{typeLabel}</span> : null}
        </div>
        <FeedAuthorHeader post={post} layout={layout} onReport={onReport} />
        {post.title ? (
          <h3 className="text-[15px] font-semibold text-neutral-900">{post.title}</h3>
        ) : null}
        {post.body ? (
          <p className="text-sm leading-relaxed text-neutral-700">{post.body}</p>
        ) : null}
        <div className="space-y-0.5 text-sm text-neutral-600">
          <p>{when}</p>
          <p className="text-neutral-500">{where}</p>
        </div>
        {post.media_url ? <FeedMobileMedia mediaUrl={post.media_url} /> : null}
      </div>
    );
  }

  return (
    <div className="-m-5 -mt-5 mb-0 rounded-t-2xl border-b border-neutral-100 bg-neutral-50/60 p-5 sm:-m-6 sm:-mt-6 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-yunicity-primary px-2.5 py-0.5 text-xs font-semibold text-white">
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
      {post.neighborhood_summary ? (
        <div className="mt-2">
          <NeighborhoodBadge summary={post.neighborhood_summary} city={post.city} />
        </div>
      ) : null}
    </div>
  );
}
