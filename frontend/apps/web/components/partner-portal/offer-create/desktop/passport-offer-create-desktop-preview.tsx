"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { OrganizationMeItem, PartnerPublic } from "@yunicity/types";
import type { PassportOfferCreateDraft } from "@yunicity/utils";
import {
  PASSPORT_OFFER_CREATE_PREVIEW_AVAILABLE,
  PASSPORT_OFFER_CREATE_PREVIEW_BODY,
  PASSPORT_OFFER_CREATE_PREVIEW_CTA,
  PASSPORT_OFFER_CREATE_PREVIEW_ELIGIBLE,
  PASSPORT_OFFER_CREATE_PREVIEW_TITLE,
  PASSPORT_OFFER_CREATE_PREVIEW_UNPUBLISHED,
  formatPassportOfferCreatePreviewDate,
  fromDatetimeLocalValue,
  inferPassportOfferCreateFlash,
  PASSPORT_DESKTOP_OFFERS_FLASH,
  resolvePassportOfferCategoryBadge,
  resolvePassportOfferCategoryBadgeClass,
} from "@yunicity/utils";
import { BadgeCheck, CalendarDays, Gift, Zap } from "lucide-react";

type PassportOfferCreateDesktopPreviewProps = {
  variant?: "desktop" | "medium";
  draft: PassportOfferCreateDraft;
  organization: OrganizationMeItem;
  partner: PartnerPublic | null;
};

export function PassportOfferCreateDesktopPreview({
  variant = "desktop",
  draft,
  organization,
  partner,
}: PassportOfferCreateDesktopPreviewProps) {
  const title = draft.title.trim() || `Avantage chez ${organization.name}`;
  const value = draft.valueLabel.trim() || title;
  const category = partner ? resolvePassportOfferCategoryBadge(partner) : null;
  const endIso = fromDatetimeLocalValue(draft.validUntil);
  const endLabel = formatPassportOfferCreatePreviewDate(endIso);
  const flash = inferPassportOfferCreateFlash(draft);
  const flashLabel = flash.isFlash ? PASSPORT_DESKTOP_OFFERS_FLASH : null;
  const isMedium = variant === "medium";

  return (
    <aside
      className={`rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm ${isMedium ? "" : "lg:sticky lg:top-6"}`}
      data-passport-offer-create-preview=""
      data-variant={variant}
    >
      <h2 className="text-sm font-bold text-neutral-900">{PASSPORT_OFFER_CREATE_PREVIEW_TITLE}</h2>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">{PASSPORT_OFFER_CREATE_PREVIEW_BODY}</p>

      <article className="relative mt-4 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <span className="absolute right-3 top-3 z-[1] rounded-md bg-neutral-900/70 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
          {PASSPORT_OFFER_CREATE_PREVIEW_UNPUBLISHED}
        </span>
        <div className="relative h-36 bg-neutral-900">
          <CulturalImage
            src={draft.coverImageUrl || partner?.cover_image_url || null}
            alt=""
            placeName={organization.name}
            className="h-full w-full object-cover opacity-90"
            sizes="320px"
            overlay={false}
            showFallbackCaption={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-end gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-white">
              <CulturalImage
                src={partner?.logo_url ?? null}
                alt=""
                placeName={organization.name}
                className="h-full w-full object-cover"
                sizes="44px"
                overlay={false}
                showFallbackCaption={false}
              />
            </div>
            <div className="min-w-0 pb-0.5">
              {category ? (
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white ${resolvePassportOfferCategoryBadgeClass(category)}`}
                >
                  {category}
                </span>
              ) : null}
              <p className="mt-1 line-clamp-2 text-sm font-bold text-white">{title}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Gift className="h-4 w-4 text-yunicity-primary" aria-hidden />
            {value}
          </p>
          {endLabel ? (
            <p className="inline-flex items-center gap-2 text-xs text-neutral-500">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {PASSPORT_OFFER_CREATE_PREVIEW_AVAILABLE} {endLabel}
            </p>
          ) : null}
          {isMedium ? (
            <p className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              {PASSPORT_OFFER_CREATE_PREVIEW_ELIGIBLE}
            </p>
          ) : null}
          {flashLabel ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <Zap className="h-3 w-3 fill-current" aria-hidden />
              {flashLabel}
            </span>
          ) : null}
          <button
            type="button"
            disabled
            className="mt-2 w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-400"
          >
            {PASSPORT_OFFER_CREATE_PREVIEW_CTA}
          </button>
        </div>
      </article>
    </aside>
  );
}
