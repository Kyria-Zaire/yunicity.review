import type { FeedPost, FeedReportReason } from "@yunicity/types";
import { MapPin } from "lucide-react";
import Link from "next/link";

import { FeedAuthorHeader } from "@/components/feed/feed-author-header";
import { FeedPublicationContextualCta } from "@/components/feed/feed-publication-actions";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";

function FeedTerritoryTags({ post }: { post: FeedPost }) {
  const hasNeighborhood = Boolean(post.neighborhood_summary);
  const cityTag = post.city?.trim().toLowerCase();

  if (!hasNeighborhood && !cityTag) return null;

  return (
    <div data-feed-territory-tags="" className="feed-publication-tags mt-3 flex flex-wrap gap-2">
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
  currentUserId,
  onReport,
}: {
  post: FeedPost;
  currentUserId: string | null;
  onReport?: (reason: FeedReportReason) => Promise<void>;
}) {
  return (
    <>
      <FeedAuthorHeader post={post} currentUserId={currentUserId} onReport={onReport} />
      {post.body ? (
        <p
          data-feed-publication-body=""
          className="feed-publication-text mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800"
        >
          {post.body}
        </p>
      ) : null}
      {/* Tags rendus UNE fois : leur visibilite par bande appartient au CSS,
          jamais au JSX (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A). */}
      <FeedTerritoryTags post={post} />
      {post.media_url ? (
        <FeedPublicationMedia mediaUrl={post.media_url} label={post.body ?? undefined} />
      ) : null}
      <FeedPublicationContextualCta post={post} />
    </>
  );
}
