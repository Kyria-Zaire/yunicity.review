"use client";

import { LoginFormFields } from "@/components/login/login-form-fields";
import { LoginPortalFooter } from "@/components/login/shared";
import { RegisterDesktopHeroPanel } from "@/components/register/desktop/register-desktop-hero-panel";
import {
  LOGIN_PORTAL_COPY,
  LOGIN_PORTAL_ROUTES,
} from "@/lib/auth/login-portal-contract";
import Link from "next/link";

type LoginDesktopScreenProps = {
  error: string | null;
  validationMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
  registerHref?: string;
};

export function LoginDesktopScreen({
  error,
  validationMessage,
  isSubmitting,
  onSubmit,
  registerHref = LOGIN_PORTAL_ROUTES.register,
}: LoginDesktopScreenProps) {
  return (
    <div
      className="hidden min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]"
      data-login-desktop-root=""
    >
      <RegisterDesktopHeroPanel />

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-end gap-3 px-6 py-5 lg:px-10">
          <p className="text-sm text-neutral-600">{LOGIN_PORTAL_COPY.noAccount}</p>
          <Link
            href={registerHref}
            data-login-desktop-control="header-register"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-yunicity-primary px-5 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5"
          >
            {LOGIN_PORTAL_COPY.registerLink}
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 lg:px-10">
          <div className="min-h-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
              {LOGIN_PORTAL_COPY.pageTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {LOGIN_PORTAL_COPY.pageSubtitle}
            </p>

            <div className="mt-8">
              <LoginFormFields
                error={error}
                validationMessage={validationMessage}
                isSubmitting={isSubmitting}
                onSubmit={onSubmit}
                registerHref={registerHref}
              />
            </div>
          </div>

          <LoginPortalFooter registerHref={registerHref} variant="full" />
        </div>
      </div>
    </div>
  );
}
