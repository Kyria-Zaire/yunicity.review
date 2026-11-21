"use client";

import { EventCreateDesktopWizard } from "@/components/events/create/desktop/event-create-desktop-wizard";
import { EventCreateMobileActionBar } from "@/components/events/create/mobile/event-create-mobile-action-bar";
import { EventCreateMobileHeader } from "@/components/events/create/mobile/event-create-mobile-header";
import { EventCreateMobilePreview } from "@/components/events/create/mobile/event-create-mobile-preview";
import { EventCreateMobileStepper } from "@/components/events/create/mobile/event-create-mobile-stepper";
import type { useEventCreateContext } from "@/hooks/use-event-create-context";
import { EVENT_CREATE_DRAFT_SAVED, EVENT_CREATE_ERROR } from "@yunicity/utils";

type EventCreateContextValue = ReturnType<typeof useEventCreateContext>;

type EventCreateMobileScreenProps = {
  ctx: EventCreateContextValue;
};

export function EventCreateMobileScreen({ ctx }: EventCreateMobileScreenProps) {
  return (
    <div className="web-mobile-event-create-only min-w-0 pb-28" data-event-create-mobile="">
      <EventCreateMobileHeader />

      <div className="space-y-4 px-4 pt-3">
        <EventCreateMobileStepper activeStep={ctx.step} />

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

        <EventCreateDesktopWizard
          variant="mobile"
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

        <EventCreateMobilePreview draft={ctx.draft} organization={ctx.selectedOrganization} />
      </div>

      <EventCreateMobileActionBar
        step={ctx.step}
        isSubmitting={ctx.isSubmitting}
        onSaveDraft={ctx.saveDraft}
        onNext={ctx.goNext}
        onSubmit={() => void ctx.submit()}
      />
    </div>
  );
}
