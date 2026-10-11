import type { FeedPost, FeedReportReason } from "@yunicity/types";
import { FEED_PASSPORT_BADGE, formatOfferValidUntil, PARTNER_OFFER_TYPE_LABELS } from "@yunicity/utils";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { FlashOfferBadge } from "@/components/feed/flash-offer-badge";
import { FeedAuthorHeader } from "@/components/feed/feed-author-header";
import { AuthorizedPostImage } from "@/components/feed/authorized-post-image";

export function OfferFeedCard({
  post,
  currentUserId,
  onReport,
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

  return (
    <div data-feed-publication-offer="" className="feed-publication-offer-editorial">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {/*
            Les signaux PROPRES a l'offre restent groupes ici : nature de
            l'avantage, Passport, echeance, partenaire verifie. Le type et la
            verification vivaient dans l'identite sur mesure ci-dessous ; les
            deplacer ici les conserve a l'identique tout en laissant une seule
            identite sur la carte.
          */}
          <div className="flex flex-wrap items-center gap-2">
            <FlashOfferBadge offer={post.offer} />
            <span className="rounded-full border border-yunicity-primary/30 bg-white px-2.5 py-0.5 text-xs font-semibold text-yunicity-primary">
              {FEED_PASSPORT_BADGE}
            </span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
              {typeLabel}
            </span>
            {/*
              `aria-hidden` rendait ce marqueur de confiance invisible aux
              lecteurs d'ecran. Meme motif que `event-create-desktop-preview`,
              qui le nomme au lieu de le masquer.
            */}
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-yunicity-primary"
              aria-label="Partenaire vérifié"
              role="img"
            />
            {!post.offer?.is_flash && expiry ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {expiry}
              </span>
            ) : null}
          </div>

          {/*
            Qui publie — l'en-tete PARTAGE. Il porte le logo du partenaire via
            `author.logo_url`, ses initiales a defaut, le handle, la meta
            territoriale et temporelle, et le menu « Plus d'actions » : une offre
            n'etait pas signalable, `currentUserId` et `onReport` etant declares
            mais jamais utilises.

            La zone de destinations partagee n'est volontairement PAS ajoutee :
            `FeedPublicationContextualCta` se ferme sur `post.type === "offer"`,
            car l'unique destination d'une offre est le Passport, porte ci-dessous.
          */}
          <div className="mt-3">
            <FeedAuthorHeader post={post} currentUserId={currentUserId} onReport={onReport} />
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
          <AuthorizedPostImage
            mediaUrl={post.media_url}
            alt=""
            variant="thumbnail"
            className="hidden shrink-0 sm:block"
          />
        ) : null}
      </div>
    </div>
  );
}
