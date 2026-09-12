"use client";

import {
  VERIFY_EMAIL_BANNER_BODY,
  VERIFY_EMAIL_BANNER_CTA,
  VERIFY_EMAIL_BANNER_DISMISS,
  VERIFY_EMAIL_BANNER_TITLE,
  shouldInviteEmailVerification,
} from "@yunicity/utils";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type VerifyEmailInviteBannerProps = {
  user: { is_verified: boolean } | null | undefined;
};

/**
 * Invitation à confirmer son adresse — NON bloquante (AUTH-01).
 *
 * Destinée aux comptes ouverts avant l'entrée en vigueur de l'exigence : ils
 * gardent un accès complet, et cette bannière propose sans jamais barrer la
 * route. Elle se ferme, et ne revient pas dans la même session.
 */
export function VerifyEmailInviteBanner({ user }: VerifyEmailInviteBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !shouldInviteEmailVerification(user)) {
    return null;
  }

  return (
    <aside
      data-testid="verify-email-invite"
      className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-neutral-900">{VERIFY_EMAIL_BANNER_TITLE}</p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {VERIFY_EMAIL_BANNER_BODY}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="min-h-11 rounded-xl px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
        >
          {VERIFY_EMAIL_BANNER_DISMISS}
        </button>
        <Link
          href="/login/verify-email"
          className="inline-flex min-h-11 items-center rounded-xl bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {VERIFY_EMAIL_BANNER_CTA}
        </Link>
      </div>
    </aside>
  );
}
