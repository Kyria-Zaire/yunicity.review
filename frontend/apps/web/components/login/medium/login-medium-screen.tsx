"use client";

import { LoginFormFields } from "@/components/login/login-form-fields";
import { LoginPortalFooter } from "@/components/login/shared";
import {
  LOGIN_PORTAL_COPY,
  LOGIN_PORTAL_ROUTES,
} from "@/lib/auth/login-portal-contract";
import Link from "next/link";

type LoginMediumScreenProps = {
  error: string | null;
  validationMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
  registerHref?: string;
};

export function LoginMediumScreen({
  error,
  validationMessage,
  isSubmitting,
  onSubmit,
  registerHref = LOGIN_PORTAL_ROUTES.register,
}: LoginMediumScreenProps) {
  return (
    <div
      className="hidden min-h-dvh w-full flex-col bg-white sm:flex lg:hidden"
      data-login-medium-root=""
    >
      <header className="flex items-center justify-end gap-3 px-6 py-5 sm:px-8 md:px-10">
        <p className="text-sm text-neutral-600">{LOGIN_PORTAL_COPY.noAccount}</p>
        <Link
          href={registerHref}
          data-login-medium-control="header-register"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-yunicity-primary px-5 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5"
        >
          {LOGIN_PORTAL_COPY.registerLink}
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 sm:px-8 md:px-10">
        <div className="min-h-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 md:text-3xl">
            {LOGIN_PORTAL_COPY.pageTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 md:text-base">
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
  );
}
