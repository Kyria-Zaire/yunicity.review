"use client";

import { ORG_REQUEST_HELP_TITLE } from "@yunicity/utils";
import { ChevronRight, HelpCircle } from "lucide-react";
import Link from "next/link";

export function OrganizationRequestDesktopHelp() {
  return (
    <section
      className="rounded-xl border border-neutral-200/90 bg-white p-3.5"
      data-org-request-desktop-help=""
    >
      <Link href="/places" className="flex items-center gap-2.5 transition hover:opacity-90">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-yunicity-primary/30 text-yunicity-primary">
          <HelpCircle className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-neutral-800">
          {ORG_REQUEST_HELP_TITLE}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
      </Link>
    </section>
  );
}
