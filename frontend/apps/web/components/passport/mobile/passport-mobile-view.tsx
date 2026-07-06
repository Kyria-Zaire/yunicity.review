"use client";

import { PassportMobileActivityList } from "@/components/passport/mobile/passport-mobile-activity-list";
import { PassportMobileHeader } from "@/components/passport/mobile/passport-mobile-header";
import { PassportMobileHeroCard } from "@/components/passport/mobile/passport-mobile-hero-card";
import { PassportMobileHowItWorks } from "@/components/passport/mobile/passport-mobile-how-it-works";
import { PassportMobileOffersCarousel } from "@/components/passport/mobile/passport-mobile-offers-carousel";
import type {
  PartnerOfferPublic,
  PassportMe,
  PassportOverviewResponse,
  PassportStamp,
  ProfileMe,
} from "@yunicity/types";

type PassportMobileViewProps = {
  profile: ProfileMe;
  displayName: string;
  overview: PassportOverviewResponse;
  passportMe: PassportMe | null;
  qrPayload: string | null;
  qrLoading: boolean;
  offers: PartnerOfferPublic[];
  stamps: PassportStamp[];
  stampsLoading: boolean;
};

/** Vue mobile Passport — layout MOBILE-PASSPORT-01. */
export function PassportMobileView({
  profile,
  displayName,
  overview,
  passportMe,
  qrPayload,
  qrLoading,
  offers,
  stamps,
  stampsLoading,
}: PassportMobileViewProps) {
  return (
    <div className="web-mobile-passport-only min-w-0 bg-[#F4F5F7] pb-24">
      <PassportMobileHeader />

      <div className="space-y-5 px-4 pt-3">
        <PassportMobileHeroCard
          profile={profile}
          displayName={displayName}
          overview={overview}
          passportMe={passportMe}
          qrPayload={qrPayload}
          qrLoading={qrLoading}
          offersCount={offers.length}
        />

        <PassportMobileOffersCarousel offers={offers} />
        <PassportMobileHowItWorks />
        <PassportMobileActivityList stamps={stamps} isLoading={stampsLoading} />
      </div>
    </div>
  );
}
