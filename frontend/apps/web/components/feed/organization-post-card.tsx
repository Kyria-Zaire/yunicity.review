import type { FeedPost, FeedReportReason } from "@yunicity/types";

import { FeedAuthorHeader } from "@/components/feed/feed-author-header";
import { FeedMobileMedia } from "@/components/feed/mobile/feed-mobile-media";

/** Post publié au nom d’un lieu — ton institutionnel doux. */
export function OrganizationPostCard({
  post,
  layout = "default",
  onReport,
}: {
  post: FeedPost;
  layout?: "default" | "mobile";
  onReport?: (reason: FeedReportReason) => Promise<void>;
}) {
  const isMobile = layout === "mobile";

  return (
    <>
      {!isMobile ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-yunicity-primary">
          Lieu partenaire
        </p>
      ) : null}
      <FeedAuthorHeader post={post} layout={layout} onReport={onReport} />
      {post.body ? (
        <p
          className={`whitespace-pre-wrap leading-relaxed text-neutral-800 ${
            isMobile ? "mt-3 text-[15px]" : "mt-4 text-[15px]"
          }`}
        >
          {post.body}
        </p>
      ) : null}
      {post.media_url ? (
        isMobile ? (
          <FeedMobileMedia mediaUrl={post.media_url} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.media_url}
            alt=""
            className="mt-4 max-h-80 w-full rounded-xl border border-yunicity-border object-cover"
          />
        )
      ) : null}
    </>
  );
}
