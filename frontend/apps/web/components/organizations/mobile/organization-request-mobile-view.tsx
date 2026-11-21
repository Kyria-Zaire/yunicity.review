"use client";

import { OrganizationRequestMobileActionBar } from "@/components/organizations/mobile/organization-request-mobile-action-bar";
import { OrganizationRequestMobileAfterSubmit } from "@/components/organizations/mobile/organization-request-mobile-after-submit";
import { OrganizationRequestMobileDuplicateCheck } from "@/components/organizations/mobile/organization-request-mobile-duplicate-check";
import { OrganizationRequestMobileHeader } from "@/components/organizations/mobile/organization-request-mobile-header";
import { OrganizationRequestMobilePreview } from "@/components/organizations/mobile/organization-request-mobile-preview";
import { OrganizationRequestMobileStepper } from "@/components/organizations/mobile/organization-request-mobile-stepper";
import { OrganizationRequestMobileWizard } from "@/components/organizations/mobile/organization-request-mobile-wizard";
import type { Neighborhood } from "@yunicity/types";
import type {
  OrganizationRequestCategoryOption,
  OrganizationRequestDraft,
  OrganizationRequestStepId,
} from "@yunicity/utils";
import { ORG_REQUEST_ERROR } from "@yunicity/utils";

type OrganizationRequestMobileViewProps = {
  step: OrganizationRequestStepId;
  draft: OrganizationRequestDraft;
  neighborhoods: Neighborhood[];
  selectedCategory: OrganizationRequestCategoryOption | null;
  selectedNeighborhood: Neighborhood | null;
  validationMessage: string | null;
  error: string | null;
  isSubmitting: boolean;
  onChange: (patch: Partial<OrganizationRequestDraft>) => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
};

/** Vue mobile complète « Proposer un lieu » (MOBILE-ORG-REQUEST-01). */
export function OrganizationRequestMobileView({
  step,
  draft,
  neighborhoods,
  selectedCategory,
  selectedNeighborhood,
  validationMessage,
  error,
  isSubmitting,
  onChange,
  onNext,
  onSaveDraft,
  onSubmit,
}: OrganizationRequestMobileViewProps) {
  return (
    <div className="web-mobile-org-request-only min-w-0 bg-[#F4F5F7] pb-28" data-org-request-mobile="">
      <OrganizationRequestMobileHeader />

      <div className="space-y-4 px-4 pt-3">
        <OrganizationRequestMobileStepper activeStep={step} />

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {ORG_REQUEST_ERROR}
          </p>
        ) : null}

        {step === "identity" ? <OrganizationRequestMobileDuplicateCheck /> : null}

        <OrganizationRequestMobileWizard
          step={step}
          draft={draft}
          neighborhoods={neighborhoods}
          selectedCategory={selectedCategory}
          selectedNeighborhood={selectedNeighborhood}
          validationMessage={validationMessage}
          onChange={onChange}
        />

        <OrganizationRequestMobilePreview draft={draft} selectedCategory={selectedCategory} />
        <OrganizationRequestMobileAfterSubmit />
      </div>

      <OrganizationRequestMobileActionBar
        step={step}
        isSubmitting={isSubmitting}
        onSaveDraft={onSaveDraft}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    </div>
  );
}
