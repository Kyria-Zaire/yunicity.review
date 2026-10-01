"use client";

import { RegisterDesktopStepper } from "@/components/register/desktop/register-desktop-stepper";
import { RegisterPortalFooter, RegisterPortalWizardBody } from "@/components/register/shared";
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

type RegisterMediumScreenProps = {
  wizard: Wizard;
  error: string | null;
  submitValidationMessage: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  loginHref?: string;
};

export function RegisterMediumScreen({
  wizard,
  error,
  submitValidationMessage,
  isSubmitting,
  onSubmit,
  loginHref = REGISTER_DESKTOP_ROUTES.login,
}: RegisterMediumScreenProps) {
  const showBack = wizard.step !== "type";
  const isLastStep = wizard.step === "finish";
  const alertMessage = error ?? wizard.validationMessage ?? submitValidationMessage;

  return (
    <div
      className="hidden min-h-dvh w-full flex-col bg-white sm:flex lg:hidden"
      data-register-medium-root=""
    >
      <header className="flex items-center justify-end gap-3 px-6 py-5 sm:px-8 md:px-10">
        <p className="text-sm text-neutral-600">{REGISTER_DESKTOP_COPY.alreadyMember}</p>
        <Link
          href={loginHref}
          data-register-medium-control="header-login"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-yunicity-primary px-5 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5"
        >
          {REGISTER_DESKTOP_COPY.loginLink}
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 pb-8 sm:px-8 md:px-10">
        <RegisterDesktopStepper activeStep={wizard.step} />

        <div className="min-h-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 md:text-3xl">
            {REGISTER_DESKTOP_COPY.pageTitle}
          </h1>
          {wizard.step === "type" ? (
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 md:text-base">
              {REGISTER_DESKTOP_COPY.pageSubtitle}
            </p>
          ) : null}

          {alertMessage ? (
            <p className="mt-5 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
              {alertMessage}
            </p>
          ) : null}

          <div className="mt-6">
            <RegisterPortalWizardBody wizard={wizard} accountLayout="grid" />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex gap-3">
            {showBack ? (
              <button
                type="button"
                onClick={wizard.goBack}
                data-register-medium-control="back"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700"
              >
                {REGISTER_BACK}
              </button>
            ) : null}

            {isLastStep ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSubmit}
                data-register-medium-control="submit"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yunicity-primary px-6 text-sm font-semibold text-white disabled:opacity-60 ${
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
                data-register-medium-control="continue"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yunicity-primary px-6 text-sm font-semibold text-white ${
                  showBack ? "flex-1" : "w-full"
                }`}
              >
                {REGISTER_CONTINUE}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          <RegisterPortalFooter loginHref={loginHref} variant="full" />
        </div>
      </div>
    </div>
  );
}
