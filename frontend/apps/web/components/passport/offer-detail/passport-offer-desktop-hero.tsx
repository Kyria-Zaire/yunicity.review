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
  resolvePassportOfferCategoryBadgeClass,
} from "@yunicity/utils";
import { Bookmark, CalendarDays, Gift, MapPin, Zap } from "lucide-react";
import Link from "next/link";

type PassportOfferDesktopHeroProps = {
  offer: PartnerOfferPublic;
  saved: boolean;
  mapHref: string;
  onToggleSaved: () => void;
};

export function PassportOfferDesktopHero({
  offer,
  saved,
  mapHref,
  onToggleSaved,
}: PassportOfferDesktopHeroProps) {
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
      className="passport-offer-area-hero relative overflow-hidden rounded-[1.35rem] bg-neutral-900 text-white"
      aria-labelledby="passport-offer-detail-hero-title"
      data-passport-offer-desktop-hero=""
    >
      <div className="absolute inset-0">
        <CulturalImage
          src={coverSrc}
          alt=""
          placeName={offer.partner.name}
          className="h-full w-full object-cover"
          sizes="(min-width: 1024px) 900px, 100vw"
          overlay={false}
          dimOverlay={false}
          showFallbackCaption={false}
          priority
        />
        <div className="absolute inset-0 bg-neutral-950/55" />
      </div>

      <div className="relative flex min-h-[20rem] flex-col justify-end gap-4 p-6 sm:min-h-[22rem] sm:p-8">
        <div className="absolute left-6 top-6 z-[1] flex flex-col items-start gap-3 sm:left-8 sm:top-8">
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
            <span className="rounded-md bg-yunicity-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
              {PASSPORT_OFFER_DETAIL_BADGE}
            </span>
            {category ? (
              <span
                className={`passport-offer-hero-category rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${resolvePassportOfferCategoryBadgeClass(category)}`}
              >
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

        <div>
          <h1 id="passport-offer-detail-hero-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 inline-flex items-center gap-2 text-base font-semibold">
            <Gift className="h-4 w-4 shrink-0" aria-hidden />
            {partnerOfferValueLabel(offer)}
          </p>
          <p className="mt-2 max-w-2xl text-sm text-white/85">
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
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/80 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-white" : ""}`} aria-hidden />
            {saved ? PASSPORT_OFFER_DETAIL_SAVED : PASSPORT_OFFER_DETAIL_SAVE}
          </button>
          <Link
            href={mapHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/80 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {PASSPORT_OFFER_DETAIL_MAP}
          </Link>
        </div>
      </div>
    </section>
  );
}
