"use client";

import { YunicityLogo } from "@/components/brand";
import {
  MemoryTokenStorage,
  RESET_PASSWORD_CONFIRM_FIELD,
  RESET_PASSWORD_CONFIRM_PLACEHOLDER,
  RESET_PASSWORD_FIELD,
  RESET_PASSWORD_FIELD_PLACEHOLDER,
  RESET_PASSWORD_INVALID_TOKEN,
  RESET_PASSWORD_LOGIN_CTA,
  RESET_PASSWORD_PAGE_BODY,
  RESET_PASSWORD_PAGE_TITLE,
  RESET_PASSWORD_SUBMIT,
  RESET_PASSWORD_SUBMITTING,
  RESET_PASSWORD_SUCCESS_BODY,
  RESET_PASSWORD_SUCCESS_TITLE,
  buildResetPasswordApiPayload,
  createAuthClient,
  getWebApiBaseUrl,
  humanizeAuthFailure,
  validateResetPasswordForm,
  validateResetPasswordToken,
} from "@yunicity/utils";
import { Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type FormEvent } from "react";

export function ResetPasswordScreen() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreenInner />
    </Suspense>
  );
}

function ResetPasswordScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const client = useMemo(
    () =>
      createAuthClient({
        apiBaseUrl: getWebApiBaseUrl(),
        platform: "web",
        storage: new MemoryTokenStorage(),
      }),
    [],
  );

  const tokenValidation = useMemo(() => validateResetPasswordToken(token), [token]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!tokenValidation.valid || !token) {
      return;
    }

    const validation = validateResetPasswordForm({ password, confirmPassword });
    if (!validation.valid) {
      setValidationMessage(validation.message);
      return;
    }

    setValidationMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await client.resetPassword(
        buildResetPasswordApiPayload(token, { password, confirmPassword }),
      );
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(
        humanizeAuthFailure(error, "Impossible de mettre à jour le mot de passe."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!tokenValidation.valid) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F4F5F7] px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm">
          <div className="mb-4 flex justify-center">
            <YunicityLogo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">{RESET_PASSWORD_PAGE_TITLE}</h1>
          <p className="mt-3 text-sm leading-relaxed text-red-700" role="alert">
            {RESET_PASSWORD_INVALID_TOKEN}
          </p>
          <Link
            href="/login/forgot-password"
            className="mt-6 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F4F5F7] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <YunicityLogo size="lg" />
        </div>

        {isSuccess ? (
          <>
            <h1 className="text-2xl font-bold text-neutral-900">{RESET_PASSWORD_SUCCESS_TITLE}</h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
              {RESET_PASSWORD_SUCCESS_BODY}
            </p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="mt-6 w-full rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              {RESET_PASSWORD_LOGIN_CTA}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-neutral-900">{RESET_PASSWORD_PAGE_TITLE}</h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{RESET_PASSWORD_PAGE_BODY}</p>

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
                  {RESET_PASSWORD_FIELD}
                </span>
                <span className="relative block">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={RESET_PASSWORD_FIELD_PLACEHOLDER}
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-10 text-sm text-neutral-900 outline-none ring-yunicity-primary/30 transition focus:border-yunicity-primary focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                  {RESET_PASSWORD_CONFIRM_FIELD}
                </span>
                <span className="relative block">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={RESET_PASSWORD_CONFIRM_PLACEHOLDER}
                    className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 outline-none ring-yunicity-primary/30 transition focus:border-yunicity-primary focus:ring-2"
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? RESET_PASSWORD_SUBMITTING : RESET_PASSWORD_SUBMIT}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
