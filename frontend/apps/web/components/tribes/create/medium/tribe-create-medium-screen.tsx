"use client";

import { TribeCreateDesktopHeader } from "@/components/tribes/create/desktop/tribe-create-desktop-header";
import { TribeCreateDesktopWizard } from "@/components/tribes/create/desktop/tribe-create-desktop-wizard";
import { TribeCreateMediumBottomRail } from "@/components/tribes/create/medium/tribe-create-medium-bottom-rail";
import { TribeCreateMediumStepper } from "@/components/tribes/create/medium/tribe-create-medium-stepper";
import type { useTribeCreateContext } from "@/hooks/use-tribe-create-context";
import { TRIBE_CREATE_DRAFT_SAVED, TRIBE_CREATE_ERROR } from "@yunicity/utils";

type TribeCreateContextValue = ReturnType<typeof useTribeCreateContext>;

type TribeCreateMediumScreenProps = {
  ctx: TribeCreateContextValue;
};

export function TribeCreateMediumScreen({ ctx }: TribeCreateMediumScreenProps) {
  return (
    <div
      className="tribe-create-medium-shell mx-auto w-full max-w-[960px] space-y-5 px-4 py-2 sm:px-5 md:px-6"
      data-tribe-create-medium=""
    >
      <TribeCreateDesktopHeader
        city={ctx.draft.city}
        draftSavedMessage={ctx.draftSavedMessage}
        onSaveExit={ctx.saveAndExit}
      />

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

      <TribeCreateMediumStepper activeStep={ctx.step} />

      <TribeCreateDesktopWizard
        variant="medium"
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

      <TribeCreateMediumBottomRail draft={ctx.draft} />
    </div>
  );
}
