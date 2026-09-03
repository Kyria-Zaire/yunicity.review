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

type PassportOfferCreateDesktopPartnerCardProps = {
  organization: OrganizationMeItem;
  partner: PartnerPublic | null;
};

export function PassportOfferCreateDesktopPartnerCard({
  organization,
  partner,
}: PassportOfferCreateDesktopPartnerCardProps) {
  const location = partner?.address?.split(",")[0]?.trim() || organization.city;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-white">
            <CulturalImage
              src={partner?.logo_url ?? null}
              alt=""
              placeName={organization.name}
              className="h-full w-full object-cover"
              sizes="56px"
              overlay={false}
              showFallbackCaption={false}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900">{organization.name}</p>
            <span className="mt-1 inline-flex rounded-md bg-[#EEF0FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">
              {PASSPORT_OFFER_CREATE_PARTNER_BADGE}
            </span>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {location} · {organization.city}
            </p>
          </div>
        </div>
      </div>

      <Link
        href={buildPartnerPortalOffersHref()}
        className="inline-flex text-sm font-semibold text-neutral-600 transition hover:text-neutral-900"
      >
        {PASSPORT_OFFER_CREATE_BACK_OFFERS}
      </Link>
    </div>
  );
}
