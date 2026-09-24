"use client";

import { PassportOfferCreateDesktopForm } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-form";
import { PassportOfferCreateDesktopHeader } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-header";
import { PassportOfferCreateMediumPartnerBar } from "@/components/partner-portal/offer-create/medium/passport-offer-create-medium-partner-bar";
import { PassportOfferCreateMediumRail } from "@/components/partner-portal/offer-create/medium/passport-offer-create-medium-rail";
import { PassportOfferCreateMediumStepper } from "@/components/partner-portal/offer-create/medium/passport-offer-create-medium-stepper";
import type { usePassportOfferCreateContext } from "@/hooks/use-passport-offer-create-context";
import { PASSPORT_OFFER_CREATE_DRAFT_SAVED, PASSPORT_OFFER_CREATE_ERROR } from "@yunicity/utils";

type PassportOfferCreateContextValue = ReturnType<typeof usePassportOfferCreateContext>;

type PassportOfferCreateMediumScreenProps = {
  ctx: PassportOfferCreateContextValue;
};

export function PassportOfferCreateMediumScreen({ ctx }: PassportOfferCreateMediumScreenProps) {
  const { organization, partner } = ctx.ctx;
  if (!organization) return null;

  return (
    <div
      className="passport-offer-create-medium-shell mx-auto w-full max-w-[960px] space-y-5"
      data-passport-offer-create-medium=""
    >
      <PassportOfferCreateDesktopHeader
        onCancel={ctx.cancel}
        onSaveDraft={() => void ctx.saveDraft()}
        onSubmit={() => void ctx.submit()}
        isSaving={ctx.isSaving}
        isSubmitting={ctx.isSubmitting}
      />

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

      <PassportOfferCreateMediumPartnerBar organization={organization} partner={partner} />
      <PassportOfferCreateMediumStepper activeStep={ctx.step} onStepClick={ctx.setStep} />

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_17.5rem] md:items-start">
        <PassportOfferCreateDesktopForm
          variant="medium"
          draft={ctx.draft}
          organization={organization}
          partner={partner}
          onChange={ctx.updateDraft}
          onSaveDraft={() => void ctx.saveDraft()}
          onSubmit={() => void ctx.submit()}
          isSaving={ctx.isSaving}
          isSubmitting={ctx.isSubmitting}
        />

        <PassportOfferCreateMediumRail
          draft={ctx.draft}
          organization={organization}
          partner={partner}
        />
      </div>
    </div>
  );
}
