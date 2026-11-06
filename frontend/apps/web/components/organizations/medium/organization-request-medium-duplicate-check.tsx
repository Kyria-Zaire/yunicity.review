"use client";

import {
  ORG_REQUEST_DUPLICATE_CTA,
  ORG_REQUEST_DUPLICATE_NOTE,
  ORG_REQUEST_DUPLICATE_TITLE,
  ORG_REQUEST_MEDIUM_DUPLICATE_BODY,
} from "@yunicity/utils";
import { Info, Search } from "lucide-react";
import Link from "next/link";

export function OrganizationRequestMediumDuplicateCheck() {
  return (
    <section
      className="rounded-2xl border border-[#C7D2FE] bg-[#EEF0FF] p-4"
      data-org-request-medium-duplicate=""
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-white">
            <Search className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-900">{ORG_REQUEST_DUPLICATE_TITLE}</p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              {ORG_REQUEST_MEDIUM_DUPLICATE_BODY}
            </p>
            <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-neutral-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {ORG_REQUEST_DUPLICATE_NOTE}
            </p>
          </div>
        </div>
        <Link
          href="/places"
          className="inline-flex shrink-0 items-center justify-center self-start rounded-xl border border-yunicity-primary bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-white/80 sm:self-center"
        >
          {ORG_REQUEST_DUPLICATE_CTA}
        </Link>
      </div>
    </section>
  );
}
