"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerOfferPublic } from "@yunicity/types";
import {
  PASSPORT_OFFER_DETAIL_DISCOVER_PLACE,
  PASSPORT_OFFER_DETAIL_MAP,
  PASSPORT_OFFER_DETAIL_PARTNER_TITLE,
  buildPartnerOfferMapHref,
  formatPassportDesktopPartnerLocation,
  partnerPublicHref,
  resolvePartnerImage,
  resolvePassportOfferCategoryBadge,
} from "@yunicity/utils";
import { ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";

type PassportOfferPartnerCardProps = {
  offer: PartnerOfferPublic;
  city: string;
};

export function PassportOfferPartnerCard({ offer, city }: PassportOfferPartnerCardProps) {
  const partnerCity = offer.partner.city || city;
  const placeHref = partnerPublicHref({ slug: offer.partner.slug, city: partnerCity });
  const mapHref = buildPartnerOfferMapHref(offer);
  const category = resolvePassportOfferCategoryBadge(offer.partner);
  const location = formatPassportDesktopPartnerLocation({
    address: null,
    city: partnerCity,
  });
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
    <section
      className="feed-desktop-surface p-5 passport-offer-area-partner"
      aria-labelledby="passport-offer-partner-title"
      data-passport-offer-partner=""
    >
      <h2 id="passport-offer-partner-title" className="text-lg font-bold text-neutral-900">
        {PASSPORT_OFFER_DETAIL_PARTNER_TITLE}
      </h2>

      <div className="passport-offer-partner-mobile mt-4 flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
          <CulturalImage
            src={coverSrc}
            alt=""
            placeName={offer.partner.name}
            className="h-full w-full object-cover"
            sizes="96px"
            overlay={false}
            showFallbackCaption={false}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/15">
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
          </div>
        </div>
        <PartnerDetails
          offer={offer}
          category={category}
          location={location}
          partnerCity={partnerCity}
          placeHref={placeHref}
          mapHref={mapHref}
        />
      </div>

      <div className="passport-offer-partner-medium mt-4 space-y-4">
        <div className="h-32 w-full overflow-hidden rounded-xl bg-neutral-100">
          <CulturalImage
            src={coverSrc}
            alt=""
            placeName={offer.partner.name}
            className="h-full w-full object-cover"
            sizes="(min-width: 1024px) 280px, 50vw"
            overlay={false}
            showFallbackCaption={false}
          />
        </div>
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-white">
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
          <PartnerDetails
            offer={offer}
            category={category}
            location={location}
            partnerCity={partnerCity}
            placeHref={placeHref}
            mapHref={mapHref}
          />
        </div>
      </div>
    </section>
  );
}

function PartnerDetails({
  offer,
  category,
  location,
  partnerCity,
  placeHref,
  mapHref,
}: {
  offer: PartnerOfferPublic;
  category: string | null;
  location: string;
  partnerCity: string;
  placeHref: string;
  mapHref: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-base font-bold leading-snug text-neutral-900">{offer.partner.name}</p>
      <p className="mt-0.5 text-sm text-neutral-500">
        Partenaire
        {category ? (
          <>
            {" · "}
            <span className="font-semibold text-orange-600">{category}</span>
          </>
        ) : null}
      </p>
      <p className="mt-2 flex items-start gap-1.5 text-sm leading-snug text-neutral-500">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          {location} · {partnerCity}
        </span>
      </p>
      <div className="mt-3 flex flex-col items-start gap-2 text-sm font-semibold text-yunicity-primary">
        <Link href={placeHref} className="inline-flex items-center gap-1.5 hover:underline">
          {PASSPORT_OFFER_DETAIL_DISCOVER_PLACE}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </Link>
        <Link href={mapHref} className="inline-flex items-center gap-1.5 hover:underline">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {PASSPORT_OFFER_DETAIL_MAP}
        </Link>
      </div>
    </div>
  );
}
