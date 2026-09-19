"use client";

import { YunicityLogo } from "@/components/brand";
import { LoginFormFields } from "@/components/login/login-form-fields";
import { LoginPortalFooter } from "@/components/login/shared";
import { RegisterPortalCompactHero } from "@/components/register/shared/register-portal-compact-hero";
import {
  LOGIN_PORTAL_COPY,
  LOGIN_PORTAL_ROUTES,
} from "@/lib/auth/login-portal-contract";
import Link from "next/link";

type LoginMobileScreenProps = {
  error: string | null;
  validationMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
  registerHref?: string;
};

export function LoginMobileScreen({
  error,
  validationMessage,
  isSubmitting,
  onSubmit,
  registerHref = LOGIN_PORTAL_ROUTES.register,
}: LoginMobileScreenProps) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-white pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"
      data-login-mobile-root=""
    >
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <YunicityLogo size="sm" showWordmark href="/" priority wordmarkClassName="text-yunicity-primary" />
        <Link
          href={registerHref}
          data-login-mobile-control="header-register"
          className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-yunicity-primary"
        >
          {LOGIN_PORTAL_COPY.registerLink}
        </Link>
      </header>

      <RegisterPortalCompactHero />

      <div className="flex flex-1 flex-col px-4 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
          {LOGIN_PORTAL_COPY.pageTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {LOGIN_PORTAL_COPY.pageSubtitle}
        </p>

        <div className="mt-6 min-h-0 flex-1">
          <LoginFormFields
            compact
            error={error}
            validationMessage={validationMessage}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            registerHref={registerHref}
          />
        </div>

        <LoginPortalFooter registerHref={registerHref} variant="compact" />
      </div>
    </div>
  );
}
