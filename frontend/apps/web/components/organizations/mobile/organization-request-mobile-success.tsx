"use client";

import { OrganizationRequestMobileHeader } from "@/components/organizations/mobile/organization-request-mobile-header";
import {
  ORG_REQUEST_SUCCESS_BODY,
  ORG_REQUEST_SUCCESS_CTA,
  ORG_REQUEST_SUCCESS_NOTE,
  ORG_REQUEST_SUCCESS_TITLE,
} from "@yunicity/utils";
import Link from "next/link";

/** Écran succès mobile (MOBILE-ORG-REQUEST-01). */
export function OrganizationRequestMobileSuccess() {
  return (
    <div className="web-mobile-org-request-only min-w-0 bg-[#F4F5F7] pb-24">
      <OrganizationRequestMobileHeader />
      <div className="px-4 pt-8">
      <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow-sm">
        <p className="text-xl font-bold text-emerald-900">{ORG_REQUEST_SUCCESS_TITLE}</p>
        <p className="mt-3 text-sm leading-relaxed text-emerald-800">{ORG_REQUEST_SUCCESS_BODY}</p>
        <p className="mt-2 text-xs text-emerald-700">{ORG_REQUEST_SUCCESS_NOTE}</p>
        <Link
          href="/organizations/me"
          className="mt-6 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
        >
          {ORG_REQUEST_SUCCESS_CTA}
        </Link>
      </div>
      </div>
    </div>
  );
}
