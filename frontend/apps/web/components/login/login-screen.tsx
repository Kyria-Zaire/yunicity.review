"use client";

import { LoginDesktopScreen } from "@/components/login/desktop";
import { LoginMediumScreen } from "@/components/login/medium";
import { LoginMobileScreen } from "@/components/login/mobile";
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
    <main>
      <LoginMobileScreen {...formProps} />
      <LoginMediumScreen {...formProps} />
      <LoginDesktopScreen {...formProps} />
    </main>
  );
}
