"use client";

import { PARTNER_LEAD_QUICK_CAPTURE_SUCCESS_MESSAGE } from "@yunicity/utils";
import { CheckCircle2, Plus, X } from "lucide-react";
import Link from "next/link";

type PartnerLeadsCaptureToastProps = {
  leadId: string;
  onDismiss: () => void;
  onAddAnother: () => void;
};

export function PartnerLeadsCaptureToast({
  leadId,
  onDismiss,
  onAddAnother,
}: PartnerLeadsCaptureToastProps) {
  return (
    <div
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-lg sm:inset-x-auto sm:right-6 sm:left-auto"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg ring-1 ring-emerald-100">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-stone-950">{PARTNER_LEAD_QUICK_CAPTURE_SUCCESS_MESSAGE}</p>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Actions rapides
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={`/partner-leads/${leadId}`}
                onClick={onDismiss}
                className="inline-flex items-center rounded-xl bg-yunicity-primary px-3.5 py-2 text-sm font-medium text-white hover:opacity-95"
              >
                Voir la fiche
              </Link>
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onAddAnother();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter un autre
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label="Fermer la notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
