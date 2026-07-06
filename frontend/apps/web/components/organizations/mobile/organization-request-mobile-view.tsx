"use client";

import { OrganizationRequestMobileContextPanel } from "@/components/organizations/mobile/organization-request-mobile-context-panel";
import { OrganizationRequestMobileHeader } from "@/components/organizations/mobile/organization-request-mobile-header";
import { OrganizationRequestMobileStepper } from "@/components/organizations/mobile/organization-request-mobile-stepper";
import { OrganizationRequestWizard } from "@/components/organizations/organization-request-wizard";
import type { Neighborhood } from "@yunicity/types";
import type {
  OrganizationRequestCategoryOption,
  OrganizationRequestDraft,
  OrganizationRequestStepId,
} from "@yunicity/utils";
import {
  ORG_REQUEST_ERROR,
  ORG_REQUEST_PORTAL_SUBTITLE,
  ORG_REQUEST_TRUST_BODY,
  ORG_REQUEST_TRUST_TITLE,
} from "@yunicity/utils";
import { ShieldCheck } from "lucide-react";

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
  onBack: () => void;
  onNext: () => void;
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
  onBack,
  onNext,
  onSubmit,
}: OrganizationRequestMobileViewProps) {
  return (
    <div className="web-mobile-org-request-only min-w-0 bg-[#F4F5F7] pb-24">
      <OrganizationRequestMobileHeader />

      <div className="space-y-4 px-4 pt-3">
        <p className="text-sm leading-relaxed text-neutral-600">{ORG_REQUEST_PORTAL_SUBTITLE}</p>

        <OrganizationRequestMobileStepper activeStep={step} />

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {ORG_REQUEST_ERROR}
          </p>
        ) : null}

        <OrganizationRequestWizard
          variant="mobile"
          step={step}
          draft={draft}
          neighborhoods={neighborhoods}
          selectedCategory={selectedCategory}
          selectedNeighborhood={selectedNeighborhood}
          validationMessage={validationMessage}
          isSubmitting={isSubmitting}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          onSubmit={onSubmit}
        />

        {step !== "publish" ? (
          <div className="rounded-xl bg-[#EEF0FF] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{ORG_REQUEST_TRUST_TITLE}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{ORG_REQUEST_TRUST_BODY}</p>
              </div>
            </div>
          </div>
        ) : null}

        {step === "info" ? <OrganizationRequestMobileContextPanel /> : null}
      </div>
    </div>
  );
}
