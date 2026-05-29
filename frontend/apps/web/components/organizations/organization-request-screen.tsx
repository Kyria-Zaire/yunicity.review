"use client";

import { OrganizationRequestAppShell } from "@/components/organizations/organization-request-app-shell";
import { OrganizationRequestSidebar } from "@/components/organizations/organization-request-sidebar";
import { OrganizationRequestStepper } from "@/components/organizations/organization-request-stepper";
import { OrganizationRequestWizard } from "@/components/organizations/organization-request-wizard";
import { useOrganizationRequestContext } from "@/hooks/use-organization-request-context";
import {
  ORG_REQUEST_ERROR,
  ORG_REQUEST_LOADING,
  ORG_REQUEST_PORTAL_SUBTITLE,
  ORG_REQUEST_PORTAL_TITLE,
  ORG_REQUEST_SUCCESS_BODY,
  ORG_REQUEST_SUCCESS_CTA,
  ORG_REQUEST_SUCCESS_NOTE,
  ORG_REQUEST_SUCCESS_TITLE,
  ORG_REQUEST_TRUST_BODY,
  ORG_REQUEST_TRUST_TITLE,
} from "@yunicity/utils";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function OrganizationRequestScreen() {
  const ctx = useOrganizationRequestContext();

  if (ctx.loading) {
    return (
      <OrganizationRequestAppShell>
        <p className="px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {ORG_REQUEST_LOADING}
        </p>
      </OrganizationRequestAppShell>
    );
  }

  if (ctx.submittedSlug) {
    return (
      <OrganizationRequestAppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
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
      <div className="mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 lg:px-6">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <header className="mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                {ORG_REQUEST_PORTAL_TITLE}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">{ORG_REQUEST_PORTAL_SUBTITLE}</p>
            </header>

            <OrganizationRequestStepper activeStep={ctx.step} />

            {ctx.error ? (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {ORG_REQUEST_ERROR}
              </p>
            ) : null}

            <OrganizationRequestWizard
              step={ctx.step}
              draft={ctx.draft}
              neighborhoods={ctx.neighborhoods}
              selectedCategory={ctx.selectedCategory}
              selectedNeighborhood={ctx.selectedNeighborhood}
              validationMessage={ctx.validationMessage}
              isSubmitting={ctx.isSubmitting}
              onChange={ctx.updateDraft}
              onBack={ctx.goBack}
              onNext={ctx.goNext}
              onSubmit={() => void ctx.submit()}
            />

            {ctx.step !== "publish" ? (
              <div className="mt-6 rounded-2xl bg-[#EEF0FF] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 shrink-0 text-yunicity-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{ORG_REQUEST_TRUST_TITLE}</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">{ORG_REQUEST_TRUST_BODY}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <OrganizationRequestSidebar />
        </div>
      </div>
    </OrganizationRequestAppShell>
  );
}
