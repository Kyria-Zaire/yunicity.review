import type { FeedPost, FeedReportReason } from "@yunicity/types";

import { FeedAuthorHeader } from "@/components/feed/feed-author-header";
import { FeedPublicationContextualCta } from "@/components/feed/feed-publication-actions";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";

/** Post publié au nom d’un lieu — ton institutionnel doux. */
export function OrganizationPostCard({
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
      {/* Sur-titre rendu partout : sa visibilite par bande appartient au CSS. */}
      <p className="feed-publication-kicker mb-2 text-xs font-medium uppercase tracking-wide text-yunicity-primary">
        Lieu partenaire
      </p>
      <FeedAuthorHeader post={post} currentUserId={currentUserId} onReport={onReport} />
      {post.body ? (
        <p
          className="feed-publication-text mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800"
        >
          {post.body}
        </p>
      ) : null}
      {post.media_url ? (
        <FeedPublicationMedia mediaUrl={post.media_url} label={post.body ?? undefined} />
      ) : null}
      <FeedPublicationContextualCta post={post} />
    </>
  );
}
