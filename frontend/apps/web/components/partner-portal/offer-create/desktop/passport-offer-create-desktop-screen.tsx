"use client";

import { PassportOfferCreateDesktopChecklist } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-checklist";
import { PassportOfferCreateDesktopForm } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-form";
import { PassportOfferCreateDesktopHeader } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-header";
import { PassportOfferCreateDesktopPartnerCard } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-partner-card";
import { PassportOfferCreateDesktopPreview } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-preview";
import { PassportOfferCreateDesktopStepper } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-stepper";
import { PassportOfferCreateDesktopTrust } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-trust";
import { PassportOfferCreateDesktopWorkflow } from "@/components/partner-portal/offer-create/desktop/passport-offer-create-desktop-workflow";
import type { usePassportOfferCreateContext } from "@/hooks/use-passport-offer-create-context";
import { PASSPORT_OFFER_CREATE_DRAFT_SAVED, PASSPORT_OFFER_CREATE_ERROR } from "@yunicity/utils";

type PassportOfferCreateContextValue = ReturnType<typeof usePassportOfferCreateContext>;

type PassportOfferCreateDesktopScreenProps = {
  ctx: PassportOfferCreateContextValue;
};

export function PassportOfferCreateDesktopScreen({ ctx }: PassportOfferCreateDesktopScreenProps) {
  const { organization, partner } = ctx.ctx;
  if (!organization) return null;

  return (
    <div data-passport-offer-create-desktop="">
      <PassportOfferCreateDesktopHeader
        onCancel={ctx.cancel}
        onSaveDraft={() => void ctx.saveDraft()}
        onSubmit={() => void ctx.submit()}
        isSaving={ctx.isSaving}
        isSubmitting={ctx.isSubmitting}
      />

      {ctx.error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {ctx.error || PASSPORT_OFFER_CREATE_ERROR}
        </p>
      ) : null}

      {ctx.validationMessage ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
          {ctx.validationMessage}
        </p>
      ) : null}

      {ctx.draftSavedMessage ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          {PASSPORT_OFFER_CREATE_DRAFT_SAVED}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <aside className="hidden space-y-5 xl:block">
          <PassportOfferCreateDesktopPartnerCard organization={organization} partner={partner} />
          <PassportOfferCreateDesktopStepper activeStep={ctx.step} onStepClick={ctx.setStep} />
        </aside>

        <div className="min-w-0">
          <PassportOfferCreateDesktopForm
            draft={ctx.draft}
            organization={organization}
            partner={partner}
            onChange={ctx.updateDraft}
          />
        </div>

        <div className="space-y-4">
          <PassportOfferCreateDesktopPreview
            draft={ctx.draft}
            organization={organization}
            partner={partner}
          />
          <PassportOfferCreateDesktopChecklist draft={ctx.draft} hasPartner={Boolean(partner)} />
          <PassportOfferCreateDesktopWorkflow />
          <PassportOfferCreateDesktopTrust />
        </div>
      </div>
    </div>
  );
}
