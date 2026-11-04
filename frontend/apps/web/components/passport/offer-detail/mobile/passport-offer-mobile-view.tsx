"use client";

import { PassportOfferDesktopBody } from "@/components/passport/offer-detail/passport-offer-desktop-body";
import { PassportOfferInfoCard } from "@/components/passport/offer-detail/passport-offer-info-card";
import { PassportOfferMobileHeader } from "@/components/passport/offer-detail/mobile/passport-offer-mobile-header";
import { PassportOfferMobileHero } from "@/components/passport/offer-detail/mobile/passport-offer-mobile-hero";
import { PassportOfferPartnerCard } from "@/components/passport/offer-detail/passport-offer-partner-card";
import { PassportOfferRelatedRail } from "@/components/passport/offer-detail/passport-offer-related-rail";
import { PassportOfferStatusCard } from "@/components/passport/offer-detail/passport-offer-status-card";
import { PassportOfferValidationCard } from "@/components/passport/offer-detail/passport-offer-validation-card";
import type { PartnerOfferPublic } from "@yunicity/types";
import type { PassportDesktopSegmentProgress } from "@yunicity/utils";
import {
  buildPartnerOfferMapHref,
  buildPassportOfferAboutCopy,
  buildPassportOfferConditionItems,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

type PassportOfferMobileViewProps = {
  offer: PartnerOfferPublic;
  related: PartnerOfferPublic[];
  city: string;
  displayName: string;
  levelLabel: string;
  segmentProgress: PassportDesktopSegmentProgress;
  qrPayload: string | null;
  qrLoading: boolean;
};

export function PassportOfferMobileView({
  offer,
  related,
  city,
  displayName,
  levelLabel,
  segmentProgress,
  qrPayload,
  qrLoading,
}: PassportOfferMobileViewProps) {
  const [saved, setSaved] = useState(false);
  const about = useMemo(() => buildPassportOfferAboutCopy(offer), [offer]);
  const conditions = useMemo(() => buildPassportOfferConditionItems(offer), [offer]);

  return (
    <div
      className="web-mobile-passport-offer-only min-w-0 bg-[#F4F5F7]"
      data-passport-offer-mobile-view=""
    >
      <PassportOfferMobileHeader saved={saved} onToggleSaved={() => setSaved((current) => !current)} />
      <div className="passport-offer-mobile-stack space-y-4 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
        <PassportOfferMobileHero
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
