"use client";

import { TribeCreateDesktopChecklist } from "@/components/tribes/create/desktop/tribe-create-desktop-checklist";
import { TribeCreateDesktopHeader } from "@/components/tribes/create/desktop/tribe-create-desktop-header";
import { TribeCreateDesktopHelp } from "@/components/tribes/create/desktop/tribe-create-desktop-help";
import { TribeCreateDesktopPreview } from "@/components/tribes/create/desktop/tribe-create-desktop-preview";
import { TribeCreateDesktopStepper } from "@/components/tribes/create/desktop/tribe-create-desktop-stepper";
import { TribeCreateDesktopWizard } from "@/components/tribes/create/desktop/tribe-create-desktop-wizard";
import type { useTribeCreateContext } from "@/hooks/use-tribe-create-context";
import { TRIBE_CREATE_ERROR } from "@yunicity/utils";

type TribeCreateContextValue = ReturnType<typeof useTribeCreateContext>;

type TribeCreateDesktopScreenProps = {
  ctx: TribeCreateContextValue;
};

export function TribeCreateDesktopScreen({ ctx }: TribeCreateDesktopScreenProps) {
  return (
    <div className="tribe-create-desktop-shell mx-auto w-full max-w-[1400px]" data-tribe-create-desktop="">
      <TribeCreateDesktopHeader
        city={ctx.draft.city}
        draftSavedMessage={ctx.draftSavedMessage}
        onSaveExit={ctx.saveAndExit}
      />

      {ctx.error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {TRIBE_CREATE_ERROR}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="hidden space-y-4 xl:block">
          <TribeCreateDesktopStepper activeStep={ctx.step} />
          <TribeCreateDesktopHelp />
        </aside>

        <div className="min-w-0">
          <TribeCreateDesktopWizard
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
        </div>

        <div className="hidden xl:block">
          <aside className="sticky top-24 space-y-4 self-start">
            <TribeCreateDesktopPreview draft={ctx.draft} />
            <TribeCreateDesktopChecklist draft={ctx.draft} />
          </aside>
        </div>
      </div>
    </div>
  );
}
