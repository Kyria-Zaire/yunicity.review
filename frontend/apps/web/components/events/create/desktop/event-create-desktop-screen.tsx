"use client";

import { EventCreateDesktopChecklist } from "@/components/events/create/desktop/event-create-desktop-checklist";
import { EventCreateDesktopHeader } from "@/components/events/create/desktop/event-create-desktop-header";
import { EventCreateDesktopHelp } from "@/components/events/create/desktop/event-create-desktop-help";
import { EventCreateDesktopPreview } from "@/components/events/create/desktop/event-create-desktop-preview";
import { EventCreateDesktopStepper } from "@/components/events/create/desktop/event-create-desktop-stepper";
import { EventCreateDesktopWizard } from "@/components/events/create/desktop/event-create-desktop-wizard";
import type { useEventCreateContext } from "@/hooks/use-event-create-context";
import { EVENT_CREATE_DRAFT_SAVED, EVENT_CREATE_ERROR } from "@yunicity/utils";

type EventCreateContextValue = ReturnType<typeof useEventCreateContext>;

type EventCreateDesktopScreenProps = {
  ctx: EventCreateContextValue;
};

export function EventCreateDesktopScreen({ ctx }: EventCreateDesktopScreenProps) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 lg:px-6" data-event-create-desktop="">
      <EventCreateDesktopHeader onSaveExit={ctx.saveAndExit} />

      {ctx.error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {EVENT_CREATE_ERROR}
        </p>
      ) : null}

      {ctx.draftSavedMessage ? (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          {EVENT_CREATE_DRAFT_SAVED}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="hidden space-y-4 xl:block">
          <EventCreateDesktopStepper activeStep={ctx.step} />
          <EventCreateDesktopChecklist draft={ctx.draft} />
          <EventCreateDesktopHelp />
        </aside>

        <div className="min-w-0">
          <EventCreateDesktopWizard
            step={ctx.step}
            draft={ctx.draft}
            organizations={ctx.organizations}
            selectedOrganization={ctx.selectedOrganization}
            showOrgPicker={ctx.showOrgPicker}
            validationMessage={ctx.validationMessage}
            isSubmitting={ctx.isSubmitting}
            onChange={ctx.updateDraft}
            onToggleOrgPicker={ctx.setShowOrgPicker}
            onBack={ctx.goBack}
            onNext={ctx.goNext}
            onSaveDraft={ctx.saveDraft}
            onSubmit={() => void ctx.submit()}
          />
        </div>

        <EventCreateDesktopPreview draft={ctx.draft} organization={ctx.selectedOrganization} />
      </div>
    </div>
  );
}
