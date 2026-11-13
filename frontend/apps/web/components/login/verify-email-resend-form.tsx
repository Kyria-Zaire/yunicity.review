"use client";

import {
  VERIFY_EMAIL_RESEND_FIELD,
  VERIFY_EMAIL_RESEND_PLACEHOLDER,
  VERIFY_EMAIL_RESEND_SUBMIT,
  VERIFY_EMAIL_RESEND_SUBMITTING,
} from "@yunicity/utils";
import { Mail } from "lucide-react";
import type { FormEvent } from "react";

type VerifyEmailResendFormProps = {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (event: FormEvent) => void;
  isSubmitting: boolean;
  validationMessage: string | null;
  /** Confirmation volontairement identique quelle que soit l'issue réelle. */
  resultMessage: string | null;
};

export function VerifyEmailResendForm({
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
  validationMessage,
  resultMessage,
}: VerifyEmailResendFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-800">
          {VERIFY_EMAIL_RESEND_FIELD}
        </span>
        <span className="relative block">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder={VERIFY_EMAIL_RESEND_PLACEHOLDER}
            className="min-h-11 w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 outline-none ring-yunicity-primary/30 transition focus:border-yunicity-primary focus:ring-2"
          />
        </span>
      </label>

      {validationMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {validationMessage}
        </p>
      ) : null}

      {resultMessage ? (
        <p
          className="rounded-lg bg-neutral-50 px-3 py-2 text-sm leading-relaxed text-neutral-700"
          role="status"
          aria-live="polite"
        >
          {resultMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-11 w-full rounded-xl border border-yunicity-primary px-4 py-3 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? VERIFY_EMAIL_RESEND_SUBMITTING : VERIFY_EMAIL_RESEND_SUBMIT}
      </button>
    </form>
  );
}
