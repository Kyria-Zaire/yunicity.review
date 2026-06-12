"use client";

import { YunicityLogo } from "@/components/brand";
import {
  LOGIN_FIELD_EMAIL,
  LOGIN_FIELD_EMAIL_PLACEHOLDER,
  LOGIN_FORGOT_BACK,
  LOGIN_FORGOT_PAGE_BODY,
  LOGIN_FORGOT_PAGE_TITLE,
  LOGIN_FORGOT_SUBMIT,
  LOGIN_FORGOT_SUBMITTING,
  LOGIN_FORGOT_SUCCESS_BODY,
  LOGIN_FORGOT_SUCCESS_TITLE,
  MemoryTokenStorage,
  buildForgotPasswordApiPayload,
  createAuthClient,
  getWebApiBaseUrl,
  humanizeAuthFailure,
  validateForgotPasswordForm,
} from "@yunicity/utils";
import { ArrowLeft, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

export function ForgotPasswordScreen() {
  const client = useMemo(
    () =>
      createAuthClient({
        apiBaseUrl: getWebApiBaseUrl(),
        platform: "web",
        storage: new MemoryTokenStorage(),
      }),
    [],
  );

  const [email, setEmail] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validation = validateForgotPasswordForm({ email });
    if (!validation.valid) {
      setValidationMessage(validation.message);
      return;
    }

    setValidationMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await client.forgotPassword(buildForgotPasswordApiPayload({ email }));
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(
        humanizeAuthFailure(error, "Impossible d'envoyer le lien de réinitialisation."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F4F5F7] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <YunicityLogo size="lg" />
        </div>

        {isSuccess ? (
          <>
            <h1 className="text-2xl font-bold text-neutral-900">{LOGIN_FORGOT_SUCCESS_TITLE}</h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
              {LOGIN_FORGOT_SUCCESS_BODY}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-neutral-900">{LOGIN_FORGOT_PAGE_TITLE}</h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
              {LOGIN_FORGOT_PAGE_BODY}
            </p>

            {errorMessage ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {errorMessage}
              </p>
            ) : null}

            {validationMessage ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {validationMessage}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                  {LOGIN_FIELD_EMAIL}
                </span>
                <span className="relative block">
                  <UserRound
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={LOGIN_FIELD_EMAIL_PLACEHOLDER}
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 outline-none ring-yunicity-primary/30 transition focus:border-yunicity-primary focus:ring-2"
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? LOGIN_FORGOT_SUBMITTING : LOGIN_FORGOT_SUBMIT}
              </button>
            </form>
          </>
        )}

        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {LOGIN_FORGOT_BACK}
        </Link>
      </div>
    </main>
  );
}
