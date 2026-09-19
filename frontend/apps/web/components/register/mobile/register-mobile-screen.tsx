"use client";

import { YunicityLogo } from "@/components/brand";
import {
  RegisterPortalCompactHero,
  RegisterPortalCompactStepper,
  RegisterPortalFooter,
  RegisterPortalWizardBody,
} from "@/components/register/shared";
import type { useRegisterWizard } from "@/hooks/use-register-wizard";
import {
  REGISTER_DESKTOP_COPY,
  REGISTER_DESKTOP_ROUTES,
} from "@/lib/auth/register-desktop-contract";
import {
  REGISTER_BACK,
  REGISTER_CONTINUE,
  REGISTER_SUBMIT,
  REGISTER_SUBMITTING,
} from "@yunicity/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type Wizard = ReturnType<typeof useRegisterWizard>;

type RegisterMobileScreenProps = {
  wizard: Wizard;
  error: string | null;
  submitValidationMessage: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  loginHref?: string;
};

export function RegisterMobileScreen({
  wizard,
  error,
  submitValidationMessage,
  isSubmitting,
  onSubmit,
  loginHref = REGISTER_DESKTOP_ROUTES.login,
}: RegisterMobileScreenProps) {
  const showBack = wizard.step !== "type";
  const isLastStep = wizard.step === "finish";
  const alertMessage = error ?? wizard.validationMessage ?? submitValidationMessage;

  return (
    <div
      className="flex min-h-dvh flex-col bg-white pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
      data-register-mobile-root=""
    >
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <YunicityLogo size="sm" showWordmark href="/" priority wordmarkClassName="text-yunicity-primary" />
        <Link
          href={loginHref}
          data-register-mobile-control="header-login"
          className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-yunicity-primary"
        >
          {REGISTER_DESKTOP_COPY.loginLink}
        </Link>
      </header>

      <RegisterPortalCompactHero />

      <div className="flex flex-1 flex-col px-4 pb-6">
        <RegisterPortalCompactStepper activeStep={wizard.step} />

        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
          {REGISTER_DESKTOP_COPY.pageTitle}
        </h1>
        {wizard.step === "type" ? (
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {REGISTER_DESKTOP_COPY.compactPageSubtitle}
          </p>
        ) : null}

        {alertMessage ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
            {alertMessage}
          </p>
        ) : null}

        <div className="mt-5 min-h-0 flex-1">
          <RegisterPortalWizardBody
            wizard={wizard}
            accountLayout="stack"
            showTypeHeading={false}
          />
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex gap-3">
            {showBack ? (
              <button
                type="button"
                onClick={wizard.goBack}
                data-register-mobile-control="back"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700"
              >
                {REGISTER_BACK}
              </button>
            ) : null}

            {isLastStep ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSubmit}
                data-register-mobile-control="submit"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yunicity-primary px-4 text-sm font-semibold text-white disabled:opacity-60 ${
                  showBack ? "flex-1" : "w-full"
                }`}
              >
                {isSubmitting ? REGISTER_SUBMITTING : REGISTER_SUBMIT}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
              </button>
            ) : (
              <button
                type="button"
                onClick={wizard.goNext}
                data-register-mobile-control="continue"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yunicity-primary px-4 text-sm font-semibold text-white ${
                  showBack ? "flex-1" : "w-full"
                }`}
              >
                {REGISTER_CONTINUE}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          <RegisterPortalFooter loginHref={loginHref} variant="compact" />
        </div>
      </div>
    </div>
  );
}
