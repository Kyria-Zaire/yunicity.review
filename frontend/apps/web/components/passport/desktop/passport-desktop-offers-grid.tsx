"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerOfferPublic } from "@yunicity/types";
import {
  PASSPORT_DESKTOP_OFFERS_CTA,
  PASSPORT_DESKTOP_OFFERS_EMPTY,
  PASSPORT_DESKTOP_OFFERS_SAVE,
  PASSPORT_DESKTOP_OFFERS_TITLE,
  PASSPORT_DESKTOP_OFFERS_VIEW_ALL,
  buildPartnerOfferHref,
  formatPassportDesktopOfferAvailability,
  partnerDisplayCategory,
  partnerOfferFlashLabel,
  partnerOfferValueLabel,
  resolvePartnerImage,
  resolvePassportDesktopCategoryTone,
} from "@yunicity/utils";
import { ArrowRight, Bookmark } from "lucide-react";
import Link from "next/link";

type PassportDesktopOffersGridProps = {
  offers: PartnerOfferPublic[];
  message?: string | null;
};

export function PassportDesktopOffersGrid({ offers, message }: PassportDesktopOffersGridProps) {
  return (
    <section
      id="passport-desktop-offers"
      className="scroll-mt-28 space-y-4"
      aria-labelledby="passport-desktop-offers-title"
    >
      <div className="flex items-end justify-between gap-3">
        <h2 id="passport-desktop-offers-title" className="text-lg font-bold text-neutral-900">
          {PASSPORT_DESKTOP_OFFERS_TITLE}
        </h2>
        {offers.length > 0 ? (
          <Link
            href="/partners"
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PASSPORT_DESKTOP_OFFERS_VIEW_ALL}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {offers.length === 0 ? (
        <p className="feed-desktop-surface px-6 py-10 text-center text-sm text-neutral-600">
          {PASSPORT_DESKTOP_OFFERS_EMPTY}
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-3">
          {offers.slice(0, 3).map((offer) => {
            const flashLabel = partnerOfferFlashLabel(offer);
            const category = partnerDisplayCategory(offer.partner);
            const categoryTone = resolvePassportDesktopCategoryTone(category);
            const coverSrc = resolvePartnerImage(
              {
                cover_image_url: offer.partner.cover_image_url,
                logo_url: offer.partner.logo_url,
                category: offer.partner.category,
              },
              "hero",
            );
            const logoSrc = resolvePartnerImage(
              {
                cover_image_url: offer.partner.cover_image_url,
                logo_url: offer.partner.logo_url,
                category: offer.partner.category,
              },
              "card",
            );

            return (
              <li key={offer.id}>
                <article className="feed-desktop-surface overflow-hidden">
                  <div className="relative h-44 overflow-hidden bg-neutral-100 sm:h-48">
                    <CulturalImage
                      src={coverSrc}
                      alt=""
                      placeName={offer.partner.name}
                      className="h-full w-full object-cover"
                      sizes="(min-width: 1024px) 320px, 100vw"
                      overlay={false}
                      showFallbackCaption={false}
                    />
                    <div className="absolute left-3 top-3 h-11 w-11 overflow-hidden rounded-full border-[3px] border-white bg-white shadow-md">
                      <CulturalImage
                        src={logoSrc}
                        alt=""
                        placeName={offer.partner.name}
                        className="h-full w-full object-cover"
                        sizes="44px"
                        overlay={false}
                        showFallbackCaption={false}
                      />
                    </div>
                    {flashLabel ? (
                      <span className="absolute right-3 top-3 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                        {flashLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-3 px-4 pb-4 pt-4">
                    <p className={`text-[11px] font-semibold ${categoryTone}`}>{category}</p>
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">{offer.partner.name}</h3>
                      <p className="mt-1 text-sm text-neutral-600">{partnerOfferValueLabel(offer)}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatPassportDesktopOfferAvailability(offer)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={buildPartnerOfferHref(offer)}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-yunicity-primary/35 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
                      >
                        {PASSPORT_DESKTOP_OFFERS_CTA}
                      </Link>
                      <Link
                        href={buildPartnerOfferHref(offer)}
                        aria-label={PASSPORT_DESKTOP_OFFERS_SAVE}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
                      >
                        <Bookmark className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
