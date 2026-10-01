"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { OrganizationMeItem, PartnerPublic } from "@yunicity/types";
import type { PassportOfferCreateDraft } from "@yunicity/utils";
import {
  PASSPORT_OFFER_CREATE_PREVIEW_AVAILABLE,
  PASSPORT_OFFER_CREATE_PREVIEW_CTA,
  PASSPORT_OFFER_CREATE_PREVIEW_ELIGIBLE,
  PASSPORT_OFFER_CREATE_PREVIEW_TITLE,
  PASSPORT_OFFER_CREATE_PREVIEW_UNPUBLISHED,
  formatPassportOfferCreatePreviewDate,
  fromDatetimeLocalValue,
  resolvePassportOfferCategoryBadge,
  resolvePassportOfferCategoryBadgeClass,
} from "@yunicity/utils";
import { BadgeCheck, ChevronDown, ChevronUp, Clock3 } from "lucide-react";
import { useState } from "react";

type PassportOfferCreateMobilePreviewProps = {
  draft: PassportOfferCreateDraft;
  organization: OrganizationMeItem;
  partner: PartnerPublic | null;
};

export function PassportOfferCreateMobilePreview({
  draft,
  organization,
  partner,
}: PassportOfferCreateMobilePreviewProps) {
  const [open, setOpen] = useState(true);
  const title = draft.title.trim() || `Avantage chez ${organization.name}`;
  const value = draft.valueLabel.trim() || title;
  const category = partner ? resolvePassportOfferCategoryBadge(partner) : null;
  const endIso = fromDatetimeLocalValue(draft.validUntil);
  const endLabel = formatPassportOfferCreatePreviewDate(endIso);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-passport-offer-create-mobile-preview=""
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-bold text-neutral-900">{PASSPORT_OFFER_CREATE_PREVIEW_TITLE}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
        )}
      </button>

      {open ? (
        <div className="border-t border-neutral-100 px-4 pb-4">
          <article className="relative mt-3 overflow-hidden rounded-2xl border border-neutral-200/90 bg-[#FAFAFB]">
            <span className="absolute bottom-3 left-3 z-[1] rounded-md bg-violet-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
              {PASSPORT_OFFER_CREATE_PREVIEW_UNPUBLISHED}
            </span>
            <div className="grid grid-cols-[3.5rem_5.5rem_minmax(0,1fr)] gap-3 p-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-neutral-200 bg-white">
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
              <div className="h-20 overflow-hidden rounded-xl bg-neutral-200">
                <CulturalImage
                  src={draft.coverImageUrl || partner?.cover_image_url || null}
                  alt=""
                  placeName={organization.name}
                  className="h-full w-full object-cover"
                  sizes="88px"
                  overlay={false}
                  showFallbackCaption={false}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                {category ? (
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white ${resolvePassportOfferCategoryBadgeClass(category)}`}
                  >
                    {category}
                  </span>
                ) : null}
                <p className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900">{title}</p>
                <p className="line-clamp-2 text-xs leading-relaxed text-neutral-600">{value}</p>
                {endLabel ? (
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {PASSPORT_OFFER_CREATE_PREVIEW_AVAILABLE} {endLabel}
                  </p>
                ) : null}
                <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {PASSPORT_OFFER_CREATE_PREVIEW_ELIGIBLE}
                </p>
              </div>
            </div>
            <div className="border-t border-neutral-200/80 px-3 py-3">
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-400"
              >
                {PASSPORT_OFFER_CREATE_PREVIEW_CTA}
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
