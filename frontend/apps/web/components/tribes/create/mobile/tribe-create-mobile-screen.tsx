"use client";

import { TribeCreateDesktopWizard } from "@/components/tribes/create/desktop/tribe-create-desktop-wizard";
import { TribeCreateMobileActionBar } from "@/components/tribes/create/mobile/tribe-create-mobile-action-bar";
import { TribeCreateMobileHeader } from "@/components/tribes/create/mobile/tribe-create-mobile-header";
import { TribeCreateMobileHelp } from "@/components/tribes/create/mobile/tribe-create-mobile-help";
import { TribeCreateMobilePreview } from "@/components/tribes/create/mobile/tribe-create-mobile-preview";
import { TribeCreateMobileStepper } from "@/components/tribes/create/mobile/tribe-create-mobile-stepper";
import type { useTribeCreateContext } from "@/hooks/use-tribe-create-context";
import { TRIBE_CREATE_DRAFT_SAVED, TRIBE_CREATE_ERROR } from "@yunicity/utils";

type TribeCreateContextValue = ReturnType<typeof useTribeCreateContext>;

type TribeCreateMobileScreenProps = {
  ctx: TribeCreateContextValue;
};

export function TribeCreateMobileScreen({ ctx }: TribeCreateMobileScreenProps) {
  return (
    <div className="web-mobile-tribe-create-only min-w-0 pb-28" data-tribe-create-mobile="">
      <TribeCreateMobileHeader />

      <div className="space-y-4 px-4 pt-3">
        <TribeCreateMobileStepper activeStep={ctx.step} />

        {ctx.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {TRIBE_CREATE_ERROR}
          </p>
        ) : null}

        {ctx.draftSavedMessage ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {TRIBE_CREATE_DRAFT_SAVED}
          </p>
        ) : null}

        <TribeCreateDesktopWizard
          variant="mobile"
          step={ctx.step}
          draft={ctx.draft}
          creatorName={ctx.creatorName}
          validationMessage={ctx.validationMessage}
          isSubmitting={ctx.isSubmitting}
          onChange={ctx.updateDraft}
          onBack={ctx.goBack}
          onNext={ctx.goNext}
          onSaveDraft={ctx.saveDraft}
          onSubmit={() => void ctx.submit()}
        />

        <TribeCreateMobilePreview draft={ctx.draft} />
        <TribeCreateMobileHelp />
      </div>

      <TribeCreateMobileActionBar
        step={ctx.step}
        isSubmitting={ctx.isSubmitting}
        onSaveDraft={ctx.saveDraft}
        onNext={ctx.goNext}
        onSubmit={() => void ctx.submit()}
      />
    </div>
  );
}
