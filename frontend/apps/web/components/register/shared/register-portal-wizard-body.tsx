"use client";

import { RegisterFinishStep } from "@/components/register/register-finish-step";
import { RegisterInfoForm } from "@/components/register/register-info-form";
import { RegisterPortalAccountTypeGrid } from "@/components/register/shared/register-portal-account-type-grid";
import { RegisterVerificationStep } from "@/components/register/register-verification-step";
import type { useRegisterWizard } from "@/hooks/use-register-wizard";

type Wizard = ReturnType<typeof useRegisterWizard>;

type RegisterPortalWizardBodyProps = {
  wizard: Wizard;
  accountLayout?: "grid" | "stack";
  showTypeHeading?: boolean;
};

export function RegisterPortalWizardBody({
  wizard,
  accountLayout = "grid",
  showTypeHeading = true,
}: RegisterPortalWizardBodyProps) {
  if (wizard.step === "type") {
    return (
      <RegisterPortalAccountTypeGrid
        selected={wizard.draft.accountType}
        onSelect={(accountType) => wizard.updateDraft({ accountType })}
        layout={accountLayout}
        showSectionHeading={showTypeHeading}
      />
    );
  }

  if (wizard.step === "info") {
    return <RegisterInfoForm draft={wizard.draft} onChange={wizard.updateDraft} />;
  }

  if (wizard.step === "verify") {
    return <RegisterVerificationStep draft={wizard.draft} onChange={wizard.updateDraft} />;
  }

  return <RegisterFinishStep draft={wizard.draft} />;
}
