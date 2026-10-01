"use client";

import { OrganizationRequestDesktopAfterSubmit } from "@/components/organizations/desktop/organization-request-desktop-after-submit";
import { OrganizationRequestDesktopChecklist } from "@/components/organizations/desktop/organization-request-desktop-checklist";
import { OrganizationRequestDesktopDuplicateCheck } from "@/components/organizations/desktop/organization-request-desktop-duplicate-check";
import { OrganizationRequestDesktopHeader } from "@/components/organizations/desktop/organization-request-desktop-header";
import { OrganizationRequestDesktopHelp } from "@/components/organizations/desktop/organization-request-desktop-help";
import { OrganizationRequestDesktopPreview } from "@/components/organizations/desktop/organization-request-desktop-preview";
import { OrganizationRequestDesktopStepper } from "@/components/organizations/desktop/organization-request-desktop-stepper";
import { OrganizationRequestDesktopWizard } from "@/components/organizations/desktop/organization-request-desktop-wizard";
import type { useOrganizationRequestContext } from "@/hooks/use-organization-request-context";
import { ORG_REQUEST_ERROR } from "@yunicity/utils";

type OrganizationRequestContextValue = ReturnType<typeof useOrganizationRequestContext>;

type OrganizationRequestDesktopScreenProps = {
  ctx: OrganizationRequestContextValue;
};

export function OrganizationRequestDesktopScreen({ ctx }: OrganizationRequestDesktopScreenProps) {
  return (
    <div
      className="mx-auto w-full max-w-[1280px] px-3 py-2 sm:px-4 lg:px-5"
      data-org-request-desktop=""
    >
      <OrganizationRequestDesktopHeader
        hasDraftContent={ctx.hasDraftContent}
        onSaveExit={ctx.saveAndExit}
      />

      {ctx.error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {ORG_REQUEST_ERROR}
        </p>
      ) : null}

      <div className="org-request-desktop-grid mt-1 grid items-start gap-4 lg:grid-cols-[180px_minmax(0,1fr)_260px] xl:grid-cols-[200px_minmax(0,1fr)_280px] xl:gap-5">
        <aside className="org-request-desktop-stepper hidden space-y-4 lg:sticky lg:top-4 lg:block">
          <OrganizationRequestDesktopStepper activeStep={ctx.step} />
          <OrganizationRequestDesktopHelp />
        </aside>

        <div className="org-request-desktop-main min-w-0 space-y-4">
          {ctx.step === "identity" ? <OrganizationRequestDesktopDuplicateCheck /> : null}
          <OrganizationRequestDesktopWizard
            step={ctx.step}
            draft={ctx.draft}
            neighborhoods={ctx.neighborhoods}
            selectedCategory={ctx.selectedCategory}
            selectedNeighborhood={ctx.selectedNeighborhood}
            validationMessage={ctx.validationMessage}
            isSubmitting={ctx.isSubmitting}
            onChange={ctx.updateDraft}
            onBack={ctx.goBack}
            onNext={ctx.goNext}
            onSaveDraft={ctx.saveDraft}
            onSubmit={() => void ctx.submit()}
          />
        </div>

        <aside className="org-request-desktop-rail min-w-0 space-y-3 lg:sticky lg:top-4">
          <OrganizationRequestDesktopPreview
            draft={ctx.draft}
            selectedCategory={ctx.selectedCategory}
          />
          <OrganizationRequestDesktopChecklist draft={ctx.draft} />
          <OrganizationRequestDesktopAfterSubmit />
        </aside>
      </div>
    </div>
  );
}
