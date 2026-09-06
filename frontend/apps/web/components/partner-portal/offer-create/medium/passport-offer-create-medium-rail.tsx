"use client";

import { PassportOfferCreateDesktopChecklist } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-checklist";
import { PassportOfferCreateDesktopPreview } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-preview";
import { PassportOfferCreateDesktopTrust } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-trust";
import { PassportOfferCreateDesktopWorkflow } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-workflow";
import type { OrganizationMeItem, PartnerPublic } from "@yunicity/types";
import type { PassportOfferCreateDraft } from "@yunicity/utils";

type PassportOfferCreateMediumRailProps = {
  draft: PassportOfferCreateDraft;
  organization: OrganizationMeItem;
  partner: PartnerPublic | null;
};

export function PassportOfferCreateMediumRail({
  draft,
  organization,
  partner,
}: PassportOfferCreateMediumRailProps) {
  return (
    <aside className="space-y-4 md:sticky md:top-4" data-passport-offer-create-medium-rail="">
      <PassportOfferCreateDesktopPreview
        variant="medium"
        draft={draft}
        organization={organization}
        partner={partner}
      />
      <PassportOfferCreateDesktopChecklist draft={draft} hasPartner={Boolean(partner)} />
      <PassportOfferCreateDesktopWorkflow />
      <PassportOfferCreateDesktopTrust variant="medium" />
    </aside>
  );
}
