"use client";

import {
  CREATE_HUB_LEGAL_FOOTER_ARIA_LABEL,
  CREATE_HUB_LEGAL_LINKS,
} from "@/lib/create-hub/create-hub-legal-links";
import Link from "next/link";

type CreateHubLegalFooterProps = {
  onNavigate: () => void;
};

export function CreateHubLegalFooter({ onNavigate }: CreateHubLegalFooterProps) {
  const [privacy, terms] = CREATE_HUB_LEGAL_LINKS;

  return (
    <nav
      aria-label={CREATE_HUB_LEGAL_FOOTER_ARIA_LABEL}
      className="mt-2.5 w-full border-t border-neutral-100 pt-2.5 text-center text-xs leading-snug text-neutral-500"
    >
      <span className="inline-flex flex-wrap items-center justify-center gap-x-1 whitespace-nowrap">
      <Link
        href={privacy.href}
        onClick={onNavigate}
        className="font-medium text-yunicity-primary transition hover:text-yunicity-primary-hover hover:underline focus:outline-none focus-visible:underline"
      >
        {privacy.label}
      </Link>
      <span className="px-1 text-neutral-300" aria-hidden>
        ·
      </span>
      <Link
        href={terms.href}
        onClick={onNavigate}
        className="font-medium text-yunicity-primary transition hover:text-yunicity-primary-hover hover:underline focus:outline-none focus-visible:underline"
      >
        {terms.label}
      </Link>
      </span>
    </nav>
  );
}
