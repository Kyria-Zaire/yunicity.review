"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerOfferPublic } from "@yunicity/types";
import {
  PASSPORT_DESKTOP_OFFERS_CTA,
  PASSPORT_DESKTOP_OFFERS_SAVE,
  PASSPORT_OFFER_DETAIL_RELATED_TITLE,
  buildPartnerOfferHref,
  partnerOfferValueLabel,
  resolvePartnerImage,
  resolvePassportDesktopCategoryTone,
  resolvePassportOfferCategoryBadge,
} from "@yunicity/utils";
import { Bookmark } from "lucide-react";
import Link from "next/link";

type PassportOfferRelatedRailProps = {
  related: PartnerOfferPublic[];
};

export function PassportOfferRelatedRail({ related }: PassportOfferRelatedRailProps) {
  if (related.length === 0) return null;

  return (
    <section
      className="passport-offer-area-related"
      aria-labelledby="passport-offer-related-title"
      data-passport-offer-related-rail=""
    >
      <h2 id="passport-offer-related-title" className="text-lg font-bold text-neutral-900">
        {PASSPORT_OFFER_DETAIL_RELATED_TITLE}
      </h2>
      <ul className="passport-offer-related-list mt-4">
        {related.map((item) => (
          <li key={item.id}>
            <RelatedOfferCard offer={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RelatedOfferCard({ offer }: { offer: PartnerOfferPublic }) {
  const category = resolvePassportOfferCategoryBadge(offer.partner);
  const tone = resolvePassportDesktopCategoryTone(category);
  const coverSrc = resolvePartnerImage(
    {
      cover_image_url: offer.partner.cover_image_url,
      logo_url: offer.partner.logo_url,
      category: offer.partner.category,
    },
    "hero",
  );

  return (
    <article className="passport-offer-related-card feed-desktop-surface h-full overflow-hidden">
      <div className="relative h-36 bg-neutral-100">
        <CulturalImage
          src={coverSrc}
          alt=""
          placeName={offer.partner.name}
          className="h-full w-full object-cover"
          sizes="300px"
          overlay={false}
          showFallbackCaption={false}
        />
        <button
          type="button"
          className="passport-offer-related-save-overlay absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 shadow-sm"
          aria-label={PASSPORT_DESKTOP_OFFERS_SAVE}
        >
          <Bookmark className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="space-y-3 p-4">
        <div>
          {category ? (
            <p className={`text-[11px] font-bold uppercase tracking-wide ${tone}`}>{category}</p>
          ) : null}
          <h3 className="mt-1 text-sm font-bold text-neutral-900">{offer.partner.name}</h3>
          <p className="mt-1 text-sm text-neutral-600">{partnerOfferValueLabel(offer)}</p>
        </div>
        <div className="passport-offer-related-actions flex items-center gap-2">
          <button
            type="button"
            className="passport-offer-related-save-inline inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-700 transition hover:bg-neutral-50"
            aria-label={PASSPORT_DESKTOP_OFFERS_SAVE}
          >
            <Bookmark className="h-4 w-4" aria-hidden />
          </button>
          <Link
            href={buildPartnerOfferHref(offer)}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-yunicity-primary/40 px-3 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            {PASSPORT_DESKTOP_OFFERS_CTA}
          </Link>
        </div>
      </div>
    </article>
  );
}
