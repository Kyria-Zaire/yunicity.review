"use client";

import { LoginFooter } from "@/components/login/login-footer";
import { LoginFormPanel } from "@/components/login/login-form-panel";
import { LoginHelpCard } from "@/components/login/login-help-card";
import { LoginMarketingPanel } from "@/components/login/login-marketing-panel";
import { LoginMobileView } from "@/components/login/mobile";
import { LoginSecurityBanner } from "@/components/login/login-security-banner";
import { useAuth } from "@/lib/auth/auth-provider";
import { buildLoginApiPayload, resolveAuthReturnPath, validateLoginForm } from "@yunicity/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

export function LoginScreen() {
  return (
    <Suspense fallback={null}>
      <LoginScreenInner />
    </Suspense>
  );
}

function LoginScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const registerHref = useMemo(() => {
    const next = searchParams.get("next");
    if (!next || !next.startsWith("/")) return "/register";
    return `/register?next=${encodeURIComponent(next)}`;
  }, [searchParams]);

  async function handleSubmit(values: { email: string; password: string }) {
    const validation = validateLoginForm(values);
    if (!validation.valid) {
      setValidationMessage(validation.message);
      return;
    }

    setValidationMessage(null);
    clearError();
    setIsSubmitting(true);
    try {
      const ok = await login(buildLoginApiPayload(values));
      if (ok) {
        router.replace(resolveAuthReturnPath(searchParams.get("next")));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const formProps = {
    error,
    validationMessage,
    isSubmitting,
    onSubmit: handleSubmit,
    registerHref,
  };

  return (
    <>
      <div className="web-desktop-auth-only min-h-dvh bg-[#F4F5F7]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-6 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="min-w-0">
              <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <div className="grid lg:grid-cols-2">
                  <LoginFormPanel {...formProps} />
                  <LoginMarketingPanel />
                </div>
              </div>

              <LoginSecurityBanner />
              <LoginFooter />
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-8">
                <LoginHelpCard />
              </div>
            </div>
          </div>

          <div className="mt-8 lg:hidden">
            <LoginHelpCard />
          </div>
        </div>
      </div>

      <div className="web-mobile-auth-only">
        <LoginMobileView {...formProps} />
      </div>
    </>
  );
}
