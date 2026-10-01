"use client";

import { EventCreateDesktopHeader } from "@/components/events/create/desktop/event-create-desktop-header";
import { EventCreateDesktopWizard } from "@/components/events/create/desktop/event-create-desktop-wizard";
import { EventCreateMediumBottomRail } from "@/components/events/create/medium/event-create-medium-bottom-rail";
import { EventCreateMediumStepper } from "@/components/events/create/medium/event-create-medium-stepper";
import type { useEventCreateContext } from "@/hooks/use-event-create-context";
import { EVENT_CREATE_DRAFT_SAVED, EVENT_CREATE_ERROR } from "@yunicity/utils";

type EventCreateContextValue = ReturnType<typeof useEventCreateContext>;

type EventCreateMediumScreenProps = {
  ctx: EventCreateContextValue;
};

export function EventCreateMediumScreen({ ctx }: EventCreateMediumScreenProps) {
  return (
    <div
      className="event-create-medium-shell mx-auto w-full max-w-[960px] space-y-5 px-4 py-2 sm:px-5 md:px-6"
      data-event-create-medium=""
    >
      <EventCreateDesktopHeader onSaveExit={ctx.saveAndExit} />

      {ctx.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {EVENT_CREATE_ERROR}
        </p>
      ) : null}

      {ctx.draftSavedMessage ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          {EVENT_CREATE_DRAFT_SAVED}
        </p>
      ) : null}

      <EventCreateMediumStepper activeStep={ctx.step} />

      <EventCreateDesktopWizard
        variant="medium"
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

      <EventCreateMediumBottomRail draft={ctx.draft} organization={ctx.selectedOrganization} />
    </div>
  );
}
