"use client";

import { YunicityLogo } from "@/components/brand";
import { LoginFormFields } from "@/components/login/login-form-fields";
import { LoginMobileBenefitsRail } from "@/components/login/mobile/login-mobile-benefits-rail";
import {
  AUTH_MOBILE_HELP_COMPACT,
  AUTH_MOBILE_SECURITY_COMPACT,
  LOGIN_HELP_CTA,
  LOGIN_PAGE_TITLE,
  LOGIN_SECURITY_CTA,
  YUNICITY_MASCOT_PATH,
} from "@yunicity/utils";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

type LoginMobileViewProps = {
  error: string | null;
  validationMessage: string | null;
  isSubmitting: boolean;
  registerHref: string;
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
};

/** Vue mobile connexion — données desktop, layout MOBILE-AUTH-01. */
export function LoginMobileView({
  error,
  validationMessage,
  isSubmitting,
  registerHref,
  onSubmit,
}: LoginMobileViewProps) {
  return (
    <div className="auth-mobile-shell min-h-dvh bg-[#F4F5F7] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="bg-gradient-to-b from-[#E8EAFF] to-[#F4F5F7] px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <YunicityLogo size="md" priority />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight text-neutral-900">
              {LOGIN_PAGE_TITLE}
            </h1>
          </div>
          <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/80 sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={YUNICITY_MASCOT_PATH}
              alt=""
              className="size-full object-contain p-1.5"
            />
          </div>
        </div>
      </header>

      <LoginMobileBenefitsRail />

      <div className="px-4">
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <LoginFormFields
            error={error}
            validationMessage={validationMessage}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            registerHref={registerHref}
            compact
          />
        </section>

        <section className="mt-4 flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/90 px-4 py-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-neutral-900">{AUTH_MOBILE_SECURITY_COMPACT}</p>
            <Link
              href="/settings"
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary"
            >
              {LOGIN_SECURITY_CTA}
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5">
          <p className="text-xs font-semibold text-neutral-900">{AUTH_MOBILE_HELP_COMPACT}</p>
          <Link
            href="/settings"
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary"
          >
            {LOGIN_HELP_CTA}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </section>
      </div>
    </div>
  );
}
