"use client";

import { HELP_CENTER_COPY, HELP_CENTER_ROUTES } from "@/lib/help/help-center-contract";
import { FilePenLine, Shield } from "lucide-react";
import Link from "next/link";

type HelpCenterContactCardProps = {
  variant?: "inline" | "rail";
};

export function HelpCenterContactCard({ variant = "inline" }: HelpCenterContactCardProps) {
  const Wrapper = variant === "rail" ? "aside" : "section";

  return (
    <Wrapper className={variant === "rail" ? "lg:sticky lg:top-6" : undefined}>
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF2FF] sm:h-24 sm:w-24">
          <FilePenLine className="h-9 w-9 text-yunicity-primary sm:h-10 sm:w-10" aria-hidden />
        </div>
        <h2 className="mt-4 text-center text-base font-bold text-neutral-950 sm:mt-5 sm:text-lg">
          {HELP_CENTER_COPY.contactTitle}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
          {HELP_CENTER_COPY.contactBody}
        </p>
        <Link
          href={HELP_CENTER_ROUTES.contact}
          data-help-center-control="contact"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover sm:mt-5"
        >
          {HELP_CENTER_COPY.contactCta}
        </Link>
        <div className="mt-5 border-t border-neutral-200/80 pt-4 sm:mt-6 sm:pt-5">
          <p className="inline-flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
            {HELP_CENTER_COPY.securityNote}
          </p>
        </div>
      </div>
    </Wrapper>
  );
}
