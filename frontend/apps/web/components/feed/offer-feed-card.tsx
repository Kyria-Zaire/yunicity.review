import type { FeedPost } from "@yunicity/types";
import { FEED_PASSPORT_BADGE, formatOfferValidUntil, PARTNER_OFFER_TYPE_LABELS } from "@yunicity/utils";
import Link from "next/link";

import { FlashOfferBadge } from "@/components/feed/flash-offer-badge";
import { FeedAuthorHeader } from "@/components/feed/feed-author-header";

export function OfferFeedCard({ post }: { post: FeedPost }) {
  const offerType = post.offer?.offer_type;
  const typeLabel =
    offerType && offerType in PARTNER_OFFER_TYPE_LABELS
      ? PARTNER_OFFER_TYPE_LABELS[offerType as keyof typeof PARTNER_OFFER_TYPE_LABELS]
      : "Avantage";
  const expiry = formatOfferValidUntil(post.offer?.valid_until);

  return (
    <div className="-m-6 mb-0 rounded-t-2xl bg-yunicity-surface p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FlashOfferBadge offer={post.offer} />
        <span className="rounded-full bg-yunicity-primary-soft px-2.5 py-0.5 text-xs font-semibold text-yunicity-primary">
          {FEED_PASSPORT_BADGE}
        </span>
        <span className="text-xs text-neutral-500">{typeLabel}</span>
        {!post.offer?.is_flash && expiry ? (
          <span className="text-xs text-neutral-500">{expiry}</span>
        ) : null}
      </div>
      <FeedAuthorHeader post={post} />
      {post.title ? (
        <h3 className="mt-3 text-base font-semibold text-neutral-900">{post.title}</h3>
      ) : null}
      {post.body ? (
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">{post.body}</p>
      ) : null}
      <Link
        href="/passport"
        className="mt-4 inline-flex text-sm font-medium text-yunicity-primary underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
      >
        Voir dans mon Passport
      </Link>
    </div>
  );
}
