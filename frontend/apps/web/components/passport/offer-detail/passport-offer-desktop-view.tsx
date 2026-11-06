"use client";

import { EventDetailBreadcrumbs } from "@/components/events/event-detail-breadcrumbs";
import { PassportOfferDesktopBody } from "@/components/passport/offer-detail/passport-offer-desktop-body";
import { PassportOfferDesktopHero } from "@/components/passport/offer-detail/passport-offer-desktop-hero";
import { PassportOfferInfoCard } from "@/components/passport/offer-detail/passport-offer-info-card";
import { PassportOfferPartnerCard } from "@/components/passport/offer-detail/passport-offer-partner-card";
import { PassportOfferRelatedRail } from "@/components/passport/offer-detail/passport-offer-related-rail";
import { PassportOfferStatusCard } from "@/components/passport/offer-detail/passport-offer-status-card";
import { PassportOfferValidationCard } from "@/components/passport/offer-detail/passport-offer-validation-card";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportDesktopSegmentProgress } from "@yunicity/utils";
import {
  PASSPORT_OFFER_DETAIL_NAV_OFFERS,
  PASSPORT_OFFER_DETAIL_NAV_PASSPORT,
  buildPartnerOfferMapHref,
  buildPassportOfferAboutCopy,
  buildPassportOfferConditionItems,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

type PassportOfferDesktopViewProps = {
  offer: PartnerOfferPublic;
  related: PartnerOfferPublic[];
  city: string;
  displayName: string;
  levelLabel: string;
  segmentProgress: PassportDesktopSegmentProgress;
  qrPayload: string | null;
  qrLoading: boolean;
};

export function PassportOfferDesktopView({
  offer,
  related,
  city,
  displayName,
  levelLabel,
  segmentProgress,
  qrPayload,
  qrLoading,
}: PassportOfferDesktopViewProps) {
  const [saved, setSaved] = useState(false);
  const breadcrumbs = useMemo(
    () => [
      { label: PASSPORT_OFFER_DETAIL_NAV_PASSPORT, href: "/passport" },
      { label: PASSPORT_OFFER_DETAIL_NAV_OFFERS, href: "/passport" },
      { label: offer.partner.name },
    ],
    [offer.partner.name],
  );
  const about = useMemo(() => buildPassportOfferAboutCopy(offer), [offer]);
  const conditions = useMemo(() => buildPassportOfferConditionItems(offer), [offer]);

  return (
    <div className="web-medium-desktop-passport-offer-only space-y-5 px-4 pb-10 sm:px-6" data-passport-offer-desktop-view="">
      <div className="passport-offer-breadcrumbs-only">
        <EventDetailBreadcrumbs items={breadcrumbs} />
      </div>

      <div className="passport-offer-layout">
        <PassportOfferDesktopHero
          offer={offer}
          saved={saved}
          mapHref={buildPartnerOfferMapHref(offer)}
          onToggleSaved={() => setSaved((current) => !current)}
        />
        <PassportOfferStatusCard
          city={city}
          displayName={displayName}
          levelLabel={levelLabel}
          segmentProgress={segmentProgress}
          qrPayload={qrPayload}
          qrLoading={qrLoading}
        />
        <PassportOfferDesktopBody offer={offer} about={about} conditions={conditions} city={city} />
        <PassportOfferPartnerCard offer={offer} city={city} />
        <PassportOfferInfoCard offer={offer} city={city} />
        <PassportOfferValidationCard />
        <PassportOfferRelatedRail related={related} />
      </div>
    </div>
  );
}
