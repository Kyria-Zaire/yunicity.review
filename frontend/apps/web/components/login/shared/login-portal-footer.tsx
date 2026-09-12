"use client";

import {
  LOGIN_PORTAL_COPY,
  LOGIN_PORTAL_ROUTES,
} from "@/lib/auth/login-portal-contract";
import Link from "next/link";

type LoginPortalFooterProps = {
  registerHref?: string;
  variant?: "full" | "compact";
};

export function LoginPortalFooter({
  registerHref = LOGIN_PORTAL_ROUTES.register,
  variant = "full",
}: LoginPortalFooterProps) {
  return (
    <div className={`space-y-4 text-center ${variant === "compact" ? "mt-6" : "mt-8"}`}>
      <p className="text-sm text-neutral-600">
        {LOGIN_PORTAL_COPY.noAccount}{" "}
        <Link href={registerHref} className="font-semibold text-yunicity-primary hover:underline">
          {LOGIN_PORTAL_COPY.registerLink}
        </Link>
      </p>

      <p className="text-xs leading-relaxed text-neutral-500">
        {LOGIN_PORTAL_COPY.legalPrefix}{" "}
        <Link href={LOGIN_PORTAL_ROUTES.terms} className="text-yunicity-primary hover:underline">
          {LOGIN_PORTAL_COPY.legalTerms}
        </Link>{" "}
        {LOGIN_PORTAL_COPY.legalAnd}{" "}
        <Link href={LOGIN_PORTAL_ROUTES.privacy} className="text-yunicity-primary hover:underline">
          {LOGIN_PORTAL_COPY.legalPrivacy}
        </Link>
        .
      </p>

      {variant === "full" ? (
        <nav
          aria-label="Liens de pied de page"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-neutral-500"
        >
          <Link href={LOGIN_PORTAL_ROUTES.help} className="hover:text-neutral-900">
            {LOGIN_PORTAL_COPY.footerHelp}
          </Link>
          <span aria-hidden>•</span>
          <Link href={LOGIN_PORTAL_ROUTES.privacy} className="hover:text-neutral-900">
            {LOGIN_PORTAL_COPY.footerPrivacy}
          </Link>
          <span aria-hidden>•</span>
          <Link href={LOGIN_PORTAL_ROUTES.terms} className="hover:text-neutral-900">
            {LOGIN_PORTAL_COPY.footerTerms}
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
