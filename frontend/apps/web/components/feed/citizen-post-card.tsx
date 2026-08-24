import type { FeedPost, FeedReportReason } from "@yunicity/types";
import { MapPin } from "lucide-react";
import Link from "next/link";

import { FeedAuthorHeader } from "@/components/feed/feed-author-header";
import { FeedMobileMedia } from "@/components/feed/mobile/feed-mobile-media";

function FeedTerritoryTags({ post }: { post: FeedPost }) {
  const hasNeighborhood = Boolean(post.neighborhood_summary);
  const cityTag = post.city?.trim().toLowerCase();

  if (!hasNeighborhood && !cityTag) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {post.neighborhood_summary ? (
        <Link
          href={`/neighborhoods/${post.neighborhood_summary.slug}`}
          className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200/80"
        >
          <MapPin className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
          {post.neighborhood_summary.display_name}
        </Link>
      ) : null}
      {cityTag ? (
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
          #{cityTag}
        </span>
      ) : null}
    </div>
  );
}

export function CitizenPostCard({
  post,
  layout = "default",
  onReport,
}: {
  post: FeedPost;
  layout?: "default" | "mobile";
  onReport?: (reason: FeedReportReason) => Promise<void>;
}) {
  return (
    <>
      <FeedAuthorHeader post={post} layout={layout} onReport={onReport} />
      {post.body ? (
        <p
          data-feed-publication-body=""
          className={`whitespace-pre-wrap leading-relaxed text-neutral-800 ${
            layout === "mobile" ? "mt-3 text-[15px]" : "mt-4 text-[15px]"
          }`}
        >
          {post.body}
        </p>
      ) : null}
      {post.media_url ? (
        layout === "mobile" ? (
          <FeedMobileMedia mediaUrl={post.media_url} label={post.body ?? undefined} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-feed-publication-media=""
            src={post.media_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="mt-4 max-h-80 w-full rounded-xl border border-yunicity-border object-cover"
          />
        )
      ) : null}
      {layout === "mobile" ? <FeedTerritoryTags post={post} /> : null}
    </>
  );
}
