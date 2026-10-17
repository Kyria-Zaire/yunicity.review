"use client";

import { PUBLIC_HOME_COPY, PUBLIC_HOME_ROUTES } from "@/lib/marketing/public-home-contract";
import Link from "next/link";

const footerLinkClass =
  "inline-flex min-h-11 items-center rounded-full px-2 text-sm text-neutral-500 transition hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 sm:px-3";

export function PublicHomeFooter() {
  return (
    <footer className="mx-auto w-full max-w-7xl border-t border-neutral-200/80 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <nav
        aria-label="Liens de pied de page"
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm text-neutral-500 sm:hidden"
      >
        <Link
          href={PUBLIC_HOME_ROUTES.help}
          data-public-home-control="footer-help"
          className={footerLinkClass}
        >
          {PUBLIC_HOME_COPY.footerHelp}
        </Link>
        <span aria-hidden="true">•</span>
        <a
          href={PUBLIC_HOME_ROUTES.contact}
          data-public-home-control="footer-contact"
          className={footerLinkClass}
        >
          {PUBLIC_HOME_COPY.footerContact}
        </a>
        <span aria-hidden="true">•</span>
        <Link
          href={PUBLIC_HOME_ROUTES.terms}
          data-public-home-control="footer-terms"
          className={footerLinkClass}
        >
          {PUBLIC_HOME_COPY.footerTerms}
        </Link>
      </nav>

      <nav
        aria-label="Liens de pied de page complets"
        className="hidden flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:flex"
      >
        <Link
          href={PUBLIC_HOME_ROUTES.help}
          data-public-home-control="footer-help"
          className={footerLinkClass}
        >
          {PUBLIC_HOME_COPY.footerHelp}
        </Link>
        <a
          href={PUBLIC_HOME_ROUTES.contact}
          data-public-home-control="footer-contact"
          className={footerLinkClass}
        >
          {PUBLIC_HOME_COPY.footerContact}
        </a>
        <Link
          href={PUBLIC_HOME_ROUTES.terms}
          data-public-home-control="footer-terms"
          className={footerLinkClass}
        >
          {PUBLIC_HOME_COPY.footerTerms}
        </Link>
        <Link
          href={PUBLIC_HOME_ROUTES.privacy}
          data-public-home-control="footer-privacy"
          className={footerLinkClass}
        >
          {PUBLIC_HOME_COPY.footerPrivacy}
        </Link>
      </nav>
    </footer>
  );
}
