"use client";

import { YunicityLogo } from "@/components/brand";
import { RegisterDesktopScreen } from "@/components/register/desktop";
import { RegisterMediumScreen } from "@/components/register/medium";
import { RegisterMobileScreen } from "@/components/register/mobile";
import { useRegisterWizard } from "@/hooks/use-register-wizard";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  buildRegisterApiPayload,
  buildRegisterPostAuthPath,
  isCitizenRegisterAccountType,
  validateRegisterStep,
  REGISTER_SUCCESS_CITIZEN_BODY,
  REGISTER_SUCCESS_CTA_FEED,
  REGISTER_SUCCESS_CTA_ORG,
  REGISTER_SUCCESS_ORG_BODY,
  REGISTER_SUCCESS_TITLE,
} from "@yunicity/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

export function RegisterScreen() {
  return (
    <Suspense fallback={null}>
      <RegisterScreenInner />
    </Suspense>
  );
}

function RegisterScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, error, clearError } = useAuth();
  const wizard = useRegisterWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPath, setSuccessPath] = useState<string | null>(null);
  const [submitValidationMessage, setSubmitValidationMessage] = useState<string | null>(null);

  const loginHref = useMemo(() => {
    const next = searchParams.get("next");
    if (!next || !next.startsWith("/")) return "/login";
    return `/login?next=${encodeURIComponent(next)}`;
  }, [searchParams]);

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

  const wizardProps = {
    wizard,
    error,
    submitValidationMessage,
    isSubmitting,
    onSubmit: () => void handleSubmit(),
    loginHref,
  };

  if (successPath) {
    const isCitizen = isCitizenRegisterAccountType(wizard.draft.accountType);
    return (
      <main className="flex min-h-dvh items-center bg-[#F4F5F7] px-4 py-8">
        <div className="mx-auto w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mb-4 flex justify-center">
            <YunicityLogo size="lg" />
          </div>
          <p className="text-lg font-bold text-emerald-900 sm:text-xl">{REGISTER_SUCCESS_TITLE}</p>
          <p className="mt-3 text-sm leading-relaxed text-emerald-800">
            {isCitizen ? REGISTER_SUCCESS_CITIZEN_BODY : REGISTER_SUCCESS_ORG_BODY}
          </p>
          <Link
            href={successPath}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-yunicity-primary px-6 py-3 text-sm font-semibold text-white sm:w-auto sm:py-2.5"
          >
            {isCitizen ? REGISTER_SUCCESS_CTA_FEED : REGISTER_SUCCESS_CTA_ORG}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <RegisterMobileScreen {...wizardProps} />
      <RegisterMediumScreen {...wizardProps} />
      <RegisterDesktopScreen {...wizardProps} />
    </main>
  );
}
