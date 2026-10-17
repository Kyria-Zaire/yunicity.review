"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerOfferPublic } from "@yunicity/types";
import {
  PASSPORT_OFFER_DETAIL_BADGE,
  PASSPORT_OFFER_DETAIL_CONTEXT,
  PASSPORT_OFFER_DETAIL_MAP,
  PASSPORT_OFFER_DETAIL_SAVE,
  PASSPORT_OFFER_DETAIL_SAVED,
  formatPassportDesktopOfferAvailability,
  partnerOfferFlashLabel,
  partnerOfferValueLabel,
  resolvePartnerImage,
  resolvePassportOfferCategoryBadge,
} from "@yunicity/utils";
import { Bookmark, CalendarDays, Gift, MapPin, Zap } from "lucide-react";
import Link from "next/link";

type PassportOfferMobileHeroProps = {
  offer: PartnerOfferPublic;
  saved: boolean;
  mapHref: string;
  onToggleSaved: () => void;
};

export function PassportOfferMobileHero({
  offer,
  saved,
  mapHref,
  onToggleSaved,
}: PassportOfferMobileHeroProps) {
  const flashLabel = partnerOfferFlashLabel(offer);
  const category = resolvePassportOfferCategoryBadge(offer.partner);
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
  const title = offer.title?.trim() || `Avantage chez ${offer.partner.name}`;

  return (
    <section
      className="passport-offer-mobile-hero relative overflow-hidden rounded-b-[1.75rem] bg-neutral-900 text-white"
      aria-labelledby="passport-offer-mobile-hero-title"
      data-passport-offer-mobile-hero=""
    >
      <div className="absolute inset-0">
        <CulturalImage
          src={coverSrc}
          alt=""
          placeName={offer.partner.name}
          className="h-full w-full object-cover"
          sizes="100vw"
          overlay={false}
          dimOverlay={false}
          showFallbackCaption={false}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/55 to-neutral-950/35" />
      </div>

      <div className="relative flex min-h-[22rem] flex-col justify-between gap-5 p-5 pb-6">
        <div className="flex flex-col items-start gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-full border-[3px] border-white bg-white shadow">
            <CulturalImage
              src={logoSrc}
              alt=""
              placeName={offer.partner.name}
              className="h-full w-full object-cover"
              sizes="56px"
              overlay={false}
              showFallbackCaption={false}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">
              {PASSPORT_OFFER_DETAIL_BADGE}
            </span>
            {category ? (
              <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-600">
                {category}
              </span>
            ) : null}
            {flashLabel ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                <Zap className="h-3 w-3 fill-current" aria-hidden />
                {flashLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 id="passport-offer-mobile-hero-title" className="text-[1.65rem] font-bold leading-tight tracking-tight">
              {title}
            </h2>
            <p className="mt-3 inline-flex items-center gap-2 text-base font-semibold">
              <Gift className="h-4 w-4 shrink-0" aria-hidden />
              {partnerOfferValueLabel(offer)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              {PASSPORT_OFFER_DETAIL_CONTEXT(offer.partner.name)}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/90">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              {formatPassportDesktopOfferAvailability(offer)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={saved}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/80 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-white" : ""}`} aria-hidden />
              {saved ? PASSPORT_OFFER_DETAIL_SAVED : PASSPORT_OFFER_DETAIL_SAVE}
            </button>
            <Link
              href={mapHref}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/80 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {PASSPORT_OFFER_DETAIL_MAP}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
