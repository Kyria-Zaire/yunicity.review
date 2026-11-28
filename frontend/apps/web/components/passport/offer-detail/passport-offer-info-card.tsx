"use client";

import type { PartnerOfferPublic } from "@yunicity/types";
import {
  PASSPORT_OFFER_DETAIL_INFO_CATEGORY,
  PASSPORT_OFFER_DETAIL_INFO_CITY,
  PASSPORT_OFFER_DETAIL_INFO_PARTNER,
  PASSPORT_OFFER_DETAIL_INFO_TITLE,
  PASSPORT_OFFER_DETAIL_INFO_UNTIL,
  PASSPORT_OFFER_DETAIL_INFO_USAGE,
  PASSPORT_OFFER_DETAIL_USAGE_ON_SITE,
  formatPassportDesktopOfferDeadline,
  resolvePassportOfferCategoryBadge,
} from "@yunicity/utils";
import { CalendarDays, MapPin, Store, UserRound, UtensilsCrossed } from "lucide-react";

type PassportOfferInfoCardProps = {
  offer: PartnerOfferPublic;
  city: string;
};

export function PassportOfferInfoCard({ offer, city }: PassportOfferInfoCardProps) {
  const category = resolvePassportOfferCategoryBadge(offer.partner);
  const partnerCity = offer.partner.city || city;
  const deadline = formatPassportDesktopOfferDeadline(offer);
  const deadlineMobile = formatPassportOfferInfoDeadline(offer);

  return (
    <section
      className="feed-desktop-surface p-5 passport-offer-area-info"
      aria-labelledby="passport-offer-info-title"
      data-passport-offer-info=""
    >
      <h2 id="passport-offer-info-title" className="text-lg font-bold text-neutral-900">
        {PASSPORT_OFFER_DETAIL_INFO_TITLE}
      </h2>
      <dl className="passport-offer-info-list mt-4 space-y-3 text-sm">
        <InfoRow
          icon={Store}
          label={PASSPORT_OFFER_DETAIL_INFO_PARTNER}
          value={`${offer.partner.name} ${partnerCity}`}
        />
        {category ? (
          <InfoRow
            icon={UtensilsCrossed}
            label={PASSPORT_OFFER_DETAIL_INFO_CATEGORY}
            value={category}
            valueClassName="font-semibold text-orange-600"
          />
        ) : null}
        <InfoRow icon={MapPin} label={PASSPORT_OFFER_DETAIL_INFO_CITY} value={partnerCity} />
        {deadline ? (
          <InfoRow
            icon={CalendarDays}
            label={PASSPORT_OFFER_DETAIL_INFO_UNTIL}
            value={deadline}
            mobileValue={deadlineMobile ?? deadline}
            valueClassName="passport-offer-info-deadline-value"
          />
        ) : null}
        <InfoRow
          icon={UserRound}
          label={PASSPORT_OFFER_DETAIL_INFO_USAGE}
          value={PASSPORT_OFFER_DETAIL_USAGE_ON_SITE}
        />
      </dl>
    </section>
  );
}

function formatPassportOfferInfoDeadline(
  offer: Pick<PartnerOfferPublic, "valid_from" | "valid_until">,
): string | null {
  if (!offer.valid_until) return null;
  const end = new Date(offer.valid_until);
  if (Number.isNaN(end.getTime())) return null;
  const dateLabel = end.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeLabel = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${dateLabel}\u00A0·\u00A0${timeLabel}`;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mobileValue,
  valueClassName,
}: {
  icon: typeof Store;
  label: string;
  value: string;
  mobileValue?: string;
  valueClassName?: string;
}) {
  const valueClasses = `font-semibold text-neutral-900 ${valueClassName ?? ""}`;
  const mobileDisplay = mobileValue ?? value;

  return (
    <div className="passport-offer-info-row">
      <div className="passport-offer-info-desktop flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
        <div className="min-w-0">
          <dt className="text-xs font-medium text-neutral-500">{label}</dt>
          <dd className={`mt-0.5 ${valueClasses}`}>{value}</dd>
        </div>
      </div>
      <dt className="passport-offer-info-label text-neutral-500">{label}</dt>
      <dd className={`passport-offer-info-value text-right ${valueClasses}`}>
        <span className="passport-offer-info-value-desktop">{value}</span>
        <span className="passport-offer-info-value-mobile">{mobileDisplay}</span>
      </dd>
    </div>
  );
}
