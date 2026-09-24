"use client";

import { PassportOfferCreateDesktopChecklist } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-checklist";
import { PassportOfferCreateDesktopForm } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-form";
import { PassportOfferCreateDesktopTrust } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-trust";
import { PassportOfferCreateDesktopWorkflow } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-workflow";
import { PassportOfferCreateMobileActionBar } from "@/components/partner-portal/offer-create/mobile/passport-offer-create-mobile-action-bar";
import { PassportOfferCreateMobileHeader } from "@/components/partner-portal/offer-create/mobile/passport-offer-create-mobile-header";
import { PassportOfferCreateMobilePartnerCard } from "@/components/partner-portal/offer-create/mobile/passport-offer-create-mobile-partner-card";
import { PassportOfferCreateMobilePreview } from "@/components/partner-portal/offer-create/mobile/passport-offer-create-mobile-preview";
import { PassportOfferCreateMobileStepper } from "@/components/partner-portal/offer-create/mobile/passport-offer-create-mobile-stepper";
import type { usePassportOfferCreateContext } from "@/hooks/use-passport-offer-create-context";
import {
  PASSPORT_OFFER_CREATE_DRAFT_BADGE,
  PASSPORT_OFFER_CREATE_DRAFT_SAVED,
  PASSPORT_OFFER_CREATE_ERROR,
  PASSPORT_OFFER_CREATE_SUBTITLE,
  PASSPORT_OFFER_CREATE_TITLE,
} from "@yunicity/utils";

type PassportOfferCreateContextValue = ReturnType<typeof usePassportOfferCreateContext>;

type PassportOfferCreateMobileScreenProps = {
  ctx: PassportOfferCreateContextValue;
};

export function PassportOfferCreateMobileScreen({ ctx }: PassportOfferCreateMobileScreenProps) {
  const { organization, partner } = ctx.ctx;
  if (!organization) return null;

  return (
    <div className="min-w-0 pb-36" data-passport-offer-create-mobile="">
      <PassportOfferCreateMobileHeader onBack={ctx.cancel} />

      <div className="space-y-4 px-4 pt-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              {PASSPORT_OFFER_CREATE_TITLE}
            </h2>
            <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              {PASSPORT_OFFER_CREATE_DRAFT_BADGE}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {PASSPORT_OFFER_CREATE_SUBTITLE}
          </p>
        </div>

        <PassportOfferCreateMobilePartnerCard organization={organization} partner={partner} />
        <PassportOfferCreateMobileStepper activeStep={ctx.step} onStepClick={ctx.setStep} />

        {ctx.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {ctx.error || PASSPORT_OFFER_CREATE_ERROR}
          </p>
        ) : null}

        {ctx.validationMessage ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
            {ctx.validationMessage}
          </p>
        ) : null}

        {ctx.draftSavedMessage ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {PASSPORT_OFFER_CREATE_DRAFT_SAVED}
          </p>
        ) : null}

        <PassportOfferCreateDesktopForm
          variant="mobile"
          draft={ctx.draft}
          organization={organization}
          partner={partner}
          onChange={ctx.updateDraft}
        />

        <div id="passport-offer-create-review" className="scroll-mt-24 space-y-4">
          <PassportOfferCreateMobilePreview
            draft={ctx.draft}
            organization={organization}
            partner={partner}
          />
          <PassportOfferCreateDesktopChecklist draft={ctx.draft} hasPartner={Boolean(partner)} />
          <PassportOfferCreateDesktopWorkflow />
          <PassportOfferCreateDesktopTrust variant="medium" />
        </div>
      </div>

      <PassportOfferCreateMobileActionBar
        isSaving={ctx.isSaving}
        isSubmitting={ctx.isSubmitting}
        onSaveDraft={() => void ctx.saveDraft()}
        onSubmit={() => void ctx.submit()}
      />
    </div>
  );
}
