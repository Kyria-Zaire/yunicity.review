"use client";

import type { PartnerLead } from "@yunicity/types";
import { buildPartnerLeadConversionSuccessCopy, buildPassportOpsListPath } from "@yunicity/utils";
import { CheckCircle2, IdCard, LayoutList, Users } from "lucide-react";
import Link from "next/link";

type PartnerLeadConversionSuccessProps = {
  lead: PartnerLead;
  onDismiss: () => void;
};

export function PartnerLeadConversionSuccess({
  lead,
  onDismiss,
}: PartnerLeadConversionSuccessProps) {
  const copy = buildPartnerLeadConversionSuccessCopy(lead);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversion-success-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="conversion-success-title" className="text-xl font-bold text-stone-950">
              {copy.title}
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-stone-800">
              {copy.subtitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{copy.body}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/partners"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
          >
            <Users className="h-4 w-4" aria-hidden />
            {copy.partnersCta}
          </Link>
          <Link
            href={buildPassportOpsListPath()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            <IdCard className="h-4 w-4" aria-hidden />
            {copy.passportCta}
          </Link>
          <Link
            href="/partner-leads"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            <LayoutList className="h-4 w-4" aria-hidden />
            {copy.pipelineCta}
          </Link>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 w-full rounded-xl px-4 py-2 text-sm text-stone-500 hover:bg-stone-50"
        >
          Rester sur la fiche prospect
        </button>
      </div>
    </div>
  );
}
