import type { FeedPost, FeedReportReason } from "@yunicity/types";
import { FEED_PASSPORT_BADGE, formatOfferValidUntil, PARTNER_OFFER_TYPE_LABELS } from "@yunicity/utils";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { FlashOfferBadge } from "@/components/feed/flash-offer-badge";

export function OfferFeedCard({
  post,
}: {
  post: FeedPost;
  currentUserId: string | null;
  onReport?: (reason: FeedReportReason) => Promise<void>;
}) {
  const offerType = post.offer?.offer_type;
  const typeLabel =
    offerType && offerType in PARTNER_OFFER_TYPE_LABELS
      ? PARTNER_OFFER_TYPE_LABELS[offerType as keyof typeof PARTNER_OFFER_TYPE_LABELS]
      : "Avantage";
  const expiry = formatOfferValidUntil(post.offer?.valid_until);
  const partnerLogo = post.author.logo_url;

  return (
    <div data-feed-publication-offer="" className="feed-publication-offer-editorial">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <FlashOfferBadge offer={post.offer} />
            <span className="rounded-full border border-yunicity-primary/30 bg-white px-2.5 py-0.5 text-xs font-semibold text-yunicity-primary">
              {FEED_PASSPORT_BADGE}
            </span>
            {!post.offer?.is_flash && expiry ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {expiry}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-start gap-3">
            {partnerLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={partnerLogo}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border border-neutral-200 object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary">
                {post.author.display_name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                {post.author.display_name}
                <BadgeCheck className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              </p>
              <p className="text-xs text-neutral-500">{typeLabel}</p>
            </div>
          </div>

          {post.title ? (
            <h3 className="mt-3 text-base font-semibold leading-snug text-neutral-900">{post.title}</h3>
          ) : null}
          {post.body ? (
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{post.body}</p>
          ) : null}

          <Link
            href="/passport"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
          >
            Voir dans mon Passport
          </Link>
        </div>

        {post.media_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.media_url}
            alt=""
            className="hidden h-24 w-24 shrink-0 rounded-xl object-cover sm:block"
            loading="lazy"
          />
        ) : null}
      </div>
    </div>
  );
}
