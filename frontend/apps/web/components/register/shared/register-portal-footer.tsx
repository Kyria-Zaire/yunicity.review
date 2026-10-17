"use client";

import {
  REGISTER_DESKTOP_COPY,
  REGISTER_DESKTOP_ROUTES,
} from "@/lib/auth/register-desktop-contract";
import Link from "next/link";

type RegisterPortalFooterProps = {
  loginHref?: string;
  variant?: "full" | "compact";
};

export function RegisterPortalFooter({
  loginHref = REGISTER_DESKTOP_ROUTES.login,
  variant = "full",
}: RegisterPortalFooterProps) {
  return (
    <div className={`space-y-4 text-center ${variant === "compact" ? "mt-6" : "mt-8"}`}>
      <p className="text-sm text-neutral-600">
        {REGISTER_DESKTOP_COPY.alreadyAccount}{" "}
        <Link href={loginHref} className="font-semibold text-yunicity-primary hover:underline">
          {REGISTER_DESKTOP_COPY.loginLink}
        </Link>
      </p>

      <p className="text-xs leading-relaxed text-neutral-500">
        {REGISTER_DESKTOP_COPY.legalPrefix}{" "}
        <Link href={REGISTER_DESKTOP_ROUTES.terms} className="text-yunicity-primary hover:underline">
          {REGISTER_DESKTOP_COPY.legalTerms}
        </Link>{" "}
        {REGISTER_DESKTOP_COPY.legalAnd}{" "}
        <Link href={REGISTER_DESKTOP_ROUTES.privacy} className="text-yunicity-primary hover:underline">
          {REGISTER_DESKTOP_COPY.legalPrivacy}
        </Link>
        .
      </p>

      {variant === "full" ? (
        <nav
          aria-label="Liens de pied de page"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-neutral-500"
        >
          <Link href={REGISTER_DESKTOP_ROUTES.help} className="hover:text-neutral-900">
            {REGISTER_DESKTOP_COPY.footerHelp}
          </Link>
          <span aria-hidden>•</span>
          <Link href={REGISTER_DESKTOP_ROUTES.privacy} className="hover:text-neutral-900">
            {REGISTER_DESKTOP_COPY.footerPrivacy}
          </Link>
          <span aria-hidden>•</span>
          <Link href={REGISTER_DESKTOP_ROUTES.terms} className="hover:text-neutral-900">
            {REGISTER_DESKTOP_COPY.footerTerms}
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
