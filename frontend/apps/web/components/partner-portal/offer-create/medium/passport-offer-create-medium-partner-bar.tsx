"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { OrganizationMeItem, PartnerPublic } from "@yunicity/types";
import {
  PASSPORT_OFFER_CREATE_BACK_OFFERS,
  PASSPORT_OFFER_CREATE_PARTNER_BADGE,
  buildPartnerPortalOffersHref,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type PassportOfferCreateMediumPartnerBarProps = {
  organization: OrganizationMeItem;
  partner: PartnerPublic | null;
};

export function PassportOfferCreateMediumPartnerBar({
  organization,
  partner,
}: PassportOfferCreateMediumPartnerBarProps) {
  const location = partner?.address?.split(",")[0]?.trim() || organization.city;

  return (
    <section
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 shadow-sm sm:px-5"
      data-passport-offer-create-medium-partner-bar=""
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-white">
          <CulturalImage
            src={partner?.logo_url ?? null}
            alt=""
            placeName={organization.name}
            className="h-full w-full object-cover"
            sizes="48px"
            overlay={false}
            showFallbackCaption={false}
          />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900">{organization.name}</p>
          <span className="mt-1 inline-flex rounded-md bg-[#EEF0FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">
            {PASSPORT_OFFER_CREATE_PARTNER_BADGE}
          </span>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-neutral-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {location} · {organization.city}
          </p>
        </div>
      </div>

      <Link
        href={buildPartnerPortalOffersHref()}
        className="shrink-0 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900"
      >
        {PASSPORT_OFFER_CREATE_BACK_OFFERS}
      </Link>
    </section>
  );
}
