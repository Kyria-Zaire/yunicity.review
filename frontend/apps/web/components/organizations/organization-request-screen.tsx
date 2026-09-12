"use client";

import { OrganizationRequestDesktopScreen } from "@/components/organizations/desktop";
import { OrganizationRequestMediumScreen } from "@/components/organizations/medium";
import { OrganizationRequestAppShell } from "@/components/organizations/organization-request-app-shell";
import {
  OrganizationRequestMobileSuccess,
  OrganizationRequestMobileView,
} from "@/components/organizations/mobile";
import { useOrganizationRequestContext } from "@/hooks/use-organization-request-context";
import {
  ORG_REQUEST_LOADING,
  ORG_REQUEST_SUCCESS_BODY,
  ORG_REQUEST_SUCCESS_CTA,
  ORG_REQUEST_SUCCESS_NOTE,
  ORG_REQUEST_SUCCESS_TITLE,
} from "@yunicity/utils";
import Link from "next/link";

export function OrganizationRequestScreen() {
  const ctx = useOrganizationRequestContext();

  if (ctx.loading) {
    return (
      <OrganizationRequestAppShell>
        <p
          className="web-mobile-org-request-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {ORG_REQUEST_LOADING}
        </p>
        <p
          className="web-medium-org-request-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {ORG_REQUEST_LOADING}
        </p>
        <p
          className="web-desktop-org-request-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {ORG_REQUEST_LOADING}
        </p>
      </OrganizationRequestAppShell>
    );
  }

  if (ctx.submittedSlug) {
    return (
      <OrganizationRequestAppShell>
        <OrganizationRequestMobileSuccess />
        <div className="web-medium-org-request-only mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 shadow-sm">
            <p className="text-xl font-bold text-emerald-900">{ORG_REQUEST_SUCCESS_TITLE}</p>
            <p className="mt-3 text-sm text-emerald-800">{ORG_REQUEST_SUCCESS_BODY}</p>
            <p className="mt-2 text-xs text-emerald-700">{ORG_REQUEST_SUCCESS_NOTE}</p>
            <Link
              href="/organizations/me"
              className="mt-6 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
            >
              {ORG_REQUEST_SUCCESS_CTA}
            </Link>
          </div>
        </div>
        <div className="web-desktop-org-request-only mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 shadow-sm">
            <p className="text-xl font-bold text-emerald-900">{ORG_REQUEST_SUCCESS_TITLE}</p>
            <p className="mt-3 text-sm text-emerald-800">{ORG_REQUEST_SUCCESS_BODY}</p>
            <p className="mt-2 text-xs text-emerald-700">{ORG_REQUEST_SUCCESS_NOTE}</p>
            <Link
              href="/organizations/me"
              className="mt-6 inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
            >
              {ORG_REQUEST_SUCCESS_CTA}
            </Link>
          </div>
        </div>
      </OrganizationRequestAppShell>
    );
  }

  return (
    <OrganizationRequestAppShell>
      <OrganizationRequestMobileView
        step={ctx.step}
        draft={ctx.draft}
        neighborhoods={ctx.neighborhoods}
        selectedCategory={ctx.selectedCategory}
        selectedNeighborhood={ctx.selectedNeighborhood}
        validationMessage={ctx.validationMessage}
        error={ctx.error}
        isSubmitting={ctx.isSubmitting}
        onChange={ctx.updateDraft}
        onNext={ctx.goNext}
        onSaveDraft={ctx.saveDraft}
        onSubmit={() => void ctx.submit()}
      />
      <div className="web-medium-org-request-only">
        <OrganizationRequestMediumScreen ctx={ctx} />
      </div>
      <div className="web-desktop-org-request-only">
        <OrganizationRequestDesktopScreen ctx={ctx} />
      </div>
    </OrganizationRequestAppShell>
  );
}
