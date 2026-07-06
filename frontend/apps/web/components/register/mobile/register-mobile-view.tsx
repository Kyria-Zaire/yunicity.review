"use client";

import { YunicityLogo } from "@/components/brand";
import { RegisterAccountTypeGrid } from "@/components/register/register-account-type-grid";
import { RegisterFinishStep } from "@/components/register/register-finish-step";
import { RegisterHelpCard } from "@/components/register/register-help-card";
import { RegisterInfoForm } from "@/components/register/register-info-form";
import { RegisterMobileBenefitsRail } from "@/components/register/mobile/register-mobile-benefits-rail";
import { RegisterMobileStepper } from "@/components/register/mobile/register-mobile-stepper";
import { RegisterVerificationStep } from "@/components/register/register-verification-step";
import type { useRegisterWizard } from "@/hooks/use-register-wizard";
import {
  REGISTER_ALREADY_MEMBER,
  REGISTER_BACK,
  REGISTER_CONTINUE,
  REGISTER_LOGIN_HINT,
  REGISTER_LOGIN_LINK,
  REGISTER_PAGE_SUBTITLE,
  REGISTER_PAGE_TITLE,
  REGISTER_SUBMIT,
  REGISTER_SUBMITTING,
} from "@yunicity/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type Wizard = ReturnType<typeof useRegisterWizard>;

type RegisterMobileViewProps = {
  wizard: Wizard;
  error: string | null;
  submitValidationMessage: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
};

/** Vue mobile inscription — wizard desktop, layout MOBILE-AUTH-01. */
export function RegisterMobileView({
  wizard,
  error,
  submitValidationMessage,
  isSubmitting,
  onSubmit,
}: RegisterMobileViewProps) {
  const showBack = wizard.step !== "type";
  const isLastStep = wizard.step === "finish";
  const alertMessage = error ?? wizard.validationMessage ?? submitValidationMessage;

  return (
    <div className="auth-mobile-shell flex min-h-dvh flex-col bg-[#F4F5F7] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="shrink-0 bg-gradient-to-b from-[#E8EAFF] to-[#F4F5F7] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start gap-3">
          <YunicityLogo size="md" priority />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-neutral-900">{REGISTER_PAGE_TITLE}</h1>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{REGISTER_PAGE_SUBTITLE}</p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4">
        <RegisterMobileStepper activeStep={wizard.step} />

        {wizard.step === "type" ? <RegisterMobileBenefitsRail /> : null}

        <section className="min-h-0 flex-1 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          {alertMessage ? (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {alertMessage}
            </p>
          ) : null}

          {wizard.step === "type" ? (
            <RegisterAccountTypeGrid
              selected={wizard.draft.accountType}
              onSelect={(accountType) => wizard.updateDraft({ accountType })}
            />
          ) : null}

          {wizard.step === "info" ? (
            <RegisterInfoForm draft={wizard.draft} onChange={wizard.updateDraft} />
          ) : null}

          {wizard.step === "verify" ? (
            <RegisterVerificationStep draft={wizard.draft} onChange={wizard.updateDraft} />
          ) : null}

          {wizard.step === "finish" ? <RegisterFinishStep draft={wizard.draft} /> : null}
        </section>

        <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-neutral-200/80 bg-[#F4F5F7]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex gap-3">
            {showBack ? (
              <button
                type="button"
                onClick={wizard.goBack}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700"
              >
                {REGISTER_BACK}
              </button>
            ) : null}

            {isLastStep ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSubmit}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? REGISTER_SUBMITTING : REGISTER_SUBMIT}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
              </button>
            ) : (
              <button
                type="button"
                onClick={wizard.goNext}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white"
              >
                {REGISTER_CONTINUE}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3 pb-2">
          <RegisterHelpCard />
          <footer className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 text-center">
            <p className="text-xs text-neutral-600">
              {REGISTER_ALREADY_MEMBER} {REGISTER_LOGIN_HINT}
            </p>
            <Link
              href="/login"
              className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white py-2.5 text-sm font-semibold text-neutral-800"
            >
              {REGISTER_LOGIN_LINK}
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
