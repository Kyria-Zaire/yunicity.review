import type { FeedPost, FeedReportReason } from "@yunicity/types";
import { FEED_PASSPORT_BADGE, formatOfferValidUntil, PARTNER_OFFER_TYPE_LABELS } from "@yunicity/utils";
import Link from "next/link";

import { FlashOfferBadge } from "@/components/feed/flash-offer-badge";
import { FeedAuthorHeader } from "@/components/feed/feed-author-header";

export function OfferFeedCard({
  post,
  layout = "default",
  onReport,
}: {
  post: FeedPost;
  layout?: "default" | "mobile";
  onReport?: (reason: FeedReportReason) => Promise<void>;
}) {
  const offerType = post.offer?.offer_type;
  const typeLabel =
    offerType && offerType in PARTNER_OFFER_TYPE_LABELS
      ? PARTNER_OFFER_TYPE_LABELS[offerType as keyof typeof PARTNER_OFFER_TYPE_LABELS]
      : "Avantage";
  const expiry = formatOfferValidUntil(post.offer?.valid_until);
  const isMobile = layout === "mobile";

  return (
    <div
      className={
        isMobile
          ? "space-y-3"
          : "-m-5 -mt-5 mb-0 rounded-t-2xl border-b border-neutral-100 bg-neutral-50/40 p-5 sm:-m-6 sm:-mt-6 sm:p-6"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <FlashOfferBadge offer={post.offer} />
        <span className="rounded-full border border-yunicity-primary/30 bg-white px-2.5 py-0.5 text-xs font-semibold text-yunicity-primary">
          {FEED_PASSPORT_BADGE}
        </span>
        <span className="text-xs font-medium text-neutral-500">{typeLabel}</span>
        {!post.offer?.is_flash && expiry ? (
          <span className="text-xs text-neutral-500">{expiry}</span>
        ) : null}
      </div>
      <FeedAuthorHeader post={post} layout={layout} onReport={onReport} />
      {post.title ? (
        <h3 className={`font-semibold text-neutral-900 ${isMobile ? "text-[15px]" : "mt-3 text-base"}`}>
          {post.title}
        </h3>
      ) : null}
      {post.body ? (
        <p
          className={`leading-relaxed text-neutral-700 ${
            isMobile ? "text-sm" : "mt-2 text-sm"
          }`}
        >
          {post.body}
        </p>
      ) : null}
      <Link
        href="/passport"
        className={`inline-flex w-full items-center justify-center rounded-full border border-yunicity-primary font-semibold text-yunicity-primary transition hover:bg-yunicity-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
          isMobile ? "mt-1 py-2.5 text-sm" : "mt-4 px-4 py-2 text-sm"
        }`}
      >
        Voir dans mon Passport
      </Link>
    </div>
  );
}
