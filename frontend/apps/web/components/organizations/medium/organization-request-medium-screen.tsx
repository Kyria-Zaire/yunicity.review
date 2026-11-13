"use client";

import { OrganizationRequestDesktopHeader } from "@/components/organizations/desktop/organization-request-desktop-header";
import { OrganizationRequestDesktopWizard } from "@/components/organizations/desktop/organization-request-desktop-wizard";
import { OrganizationRequestMediumBottomRail } from "@/components/organizations/medium/organization-request-medium-bottom-rail";
import { OrganizationRequestMediumDuplicateCheck } from "@/components/organizations/medium/organization-request-medium-duplicate-check";
import { OrganizationRequestMediumStepper } from "@/components/organizations/medium/organization-request-medium-stepper";
import type { useOrganizationRequestContext } from "@/hooks/use-organization-request-context";
import { ORG_REQUEST_ERROR } from "@yunicity/utils";

type OrganizationRequestContextValue = ReturnType<typeof useOrganizationRequestContext>;

type OrganizationRequestMediumScreenProps = {
  ctx: OrganizationRequestContextValue;
};

export function OrganizationRequestMediumScreen({ ctx }: OrganizationRequestMediumScreenProps) {
  return (
    <div
      className="org-request-medium-shell mx-auto w-full max-w-[960px] space-y-4 px-4 py-2 sm:px-5 md:px-6"
      data-org-request-medium=""
    >
      <OrganizationRequestDesktopHeader
        hasDraftContent={ctx.hasDraftContent}
        onSaveExit={ctx.saveAndExit}
      />

      {ctx.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {ORG_REQUEST_ERROR}
        </p>
      ) : null}

      <OrganizationRequestMediumStepper activeStep={ctx.step} />

      {ctx.step === "identity" ? <OrganizationRequestMediumDuplicateCheck /> : null}

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

      <OrganizationRequestMediumBottomRail
        draft={ctx.draft}
        selectedCategory={ctx.selectedCategory}
      />
    </div>
  );
}
