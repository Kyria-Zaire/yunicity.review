"use client";

import { RegisterAccountTypeGrid } from "@/components/register/register-account-type-grid";
import { YunicityLogo } from "@/components/brand";
import { RegisterFinishStep } from "@/components/register/register-finish-step";
import { RegisterHelpCard } from "@/components/register/register-help-card";
import { RegisterInfoForm } from "@/components/register/register-info-form";
import { RegisterMobileView } from "@/components/register/mobile";
import { RegisterRightRail } from "@/components/register/register-right-rail";
import { RegisterStepper } from "@/components/register/register-stepper";
import { RegisterVerificationStep } from "@/components/register/register-verification-step";
import { useRegisterWizard } from "@/hooks/use-register-wizard";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  buildRegisterApiPayload,
  buildRegisterPostAuthPath,
  isCitizenRegisterAccountType,
  validateRegisterStep,
  REGISTER_ALREADY_MEMBER,
  REGISTER_BACK,
  REGISTER_CONTINUE,
  REGISTER_LOGIN_HINT,
  REGISTER_LOGIN_LINK,
  REGISTER_PAGE_SUBTITLE,
  REGISTER_PAGE_TITLE,
  REGISTER_SUBMIT,
  REGISTER_SUBMITTING,
  REGISTER_SUCCESS_CITIZEN_BODY,
  REGISTER_SUCCESS_CTA_FEED,
  REGISTER_SUCCESS_CTA_ORG,
  REGISTER_SUCCESS_ORG_BODY,
  REGISTER_SUCCESS_TITLE,
} from "@yunicity/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterScreen() {
  const router = useRouter();
  const { register, error, clearError } = useAuth();
  const wizard = useRegisterWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPath, setSuccessPath] = useState<string | null>(null);
  const [submitValidationMessage, setSubmitValidationMessage] = useState<string | null>(null);

  async function handleSubmit() {
    const validation = validateRegisterStep("finish", wizard.draft);
    if (!validation.valid) {
      setSubmitValidationMessage(validation.message);
      return;
    }
    setSubmitValidationMessage(null);

    clearError();
    setIsSubmitting(true);
    try {
      const ok = await register(buildRegisterApiPayload(wizard.draft));
      if (ok) {
        const path = buildRegisterPostAuthPath(wizard.draft.accountType);
        router.replace(path);
        setSuccessPath(path);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successPath) {
    const isCitizen = isCitizenRegisterAccountType(wizard.draft.accountType);
    return (
      <>
        <div className="web-desktop-auth-only min-h-dvh bg-[#F4F5F7]">
          <div className="mx-auto flex min-h-dvh max-w-lg items-center px-4 py-12">
            <div className="w-full rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 flex justify-center">
                <YunicityLogo size="xl" />
              </div>
              <p className="text-xl font-bold text-emerald-900">{REGISTER_SUCCESS_TITLE}</p>
              <p className="mt-3 text-sm leading-relaxed text-emerald-800">
                {isCitizen ? REGISTER_SUCCESS_CITIZEN_BODY : REGISTER_SUCCESS_ORG_BODY}
              </p>
              <Link
                href={successPath}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-yunicity-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
              >
                {isCitizen ? REGISTER_SUCCESS_CTA_FEED : REGISTER_SUCCESS_CTA_ORG}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className="web-mobile-auth-only flex min-h-dvh items-center bg-[#F4F5F7] px-4 py-8">
          <div className="w-full rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <YunicityLogo size="lg" />
            </div>
            <p className="text-lg font-bold text-emerald-900">{REGISTER_SUCCESS_TITLE}</p>
            <p className="mt-3 text-sm leading-relaxed text-emerald-800">
              {isCitizen ? REGISTER_SUCCESS_CITIZEN_BODY : REGISTER_SUCCESS_ORG_BODY}
            </p>
            <Link
              href={successPath}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-yunicity-primary px-6 py-3 text-sm font-semibold text-white"
            >
              {isCitizen ? REGISTER_SUCCESS_CTA_FEED : REGISTER_SUCCESS_CTA_ORG}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </>
    );
  }

  const showBack = wizard.step !== "type";
  const isLastStep = wizard.step === "finish";

  return (
    <>
      <div className="web-desktop-auth-only min-h-dvh bg-[#F4F5F7]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-6 lg:py-12">
          <header className="mb-6 flex items-start gap-3">
            <YunicityLogo size="lg" priority />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                {REGISTER_PAGE_TITLE}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600 sm:text-base">
                {REGISTER_PAGE_SUBTITLE}
              </p>
            </div>
          </header>

          <RegisterStepper activeStep={wizard.step} />

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8">
                {error ? (
                  <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}

                {wizard.validationMessage || submitValidationMessage ? (
                  <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                    {wizard.validationMessage ?? submitValidationMessage}
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

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {showBack ? (
                    <button
                      type="button"
                      onClick={wizard.goBack}
                      className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                    >
                      {REGISTER_BACK}
                    </button>
                  ) : (
                    <span aria-hidden />
                  )}

                  {isLastStep ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleSubmit()}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-yunicity-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60 sm:ml-auto"
                    >
                      {isSubmitting ? REGISTER_SUBMITTING : REGISTER_SUBMIT}
                      {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={wizard.goNext}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-yunicity-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover sm:ml-auto"
                    >
                      {REGISTER_CONTINUE}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>

              <RegisterHelpCard />
            </div>

            <RegisterRightRail />
          </div>

          <footer className="mt-10 rounded-2xl border border-neutral-200/90 bg-white px-6 py-5 text-center shadow-sm">
            <p className="text-sm text-neutral-600">
              {REGISTER_ALREADY_MEMBER} {REGISTER_LOGIN_HINT}
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              {REGISTER_LOGIN_LINK}
            </Link>
          </footer>
        </div>
      </div>

      <div className="web-mobile-auth-only">
        <RegisterMobileView
          wizard={wizard}
          error={error}
          submitValidationMessage={submitValidationMessage}
          isSubmitting={isSubmitting}
          onSubmit={() => void handleSubmit()}
        />
      </div>
    </>
  );
}
