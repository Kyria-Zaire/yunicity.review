import type { ScanRedeemResponse } from "@yunicity/types";
import { PARTNER_OFFER_TYPE_LABELS } from "@yunicity/utils";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface PartnerScanSuccessCardProps {
  result: ScanRedeemResponse;
  onNewScan: () => void;
}

export function PartnerScanSuccessCard({ result, onNewScan }: PartnerScanSuccessCardProps) {
  return (
    <section
      className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm sm:p-5"
      aria-labelledby="partner-scan-success-title"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="partner-scan-success-title" className="text-lg font-semibold text-emerald-950">
            Interaction enregistrée
          </h2>
          <p className="text-sm text-emerald-900">{result.message}</p>
        </div>
      </div>

      <dl className="grid gap-2 rounded-xl bg-white/80 px-4 py-3 text-sm text-stone-800">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Offre</dt>
          <dd className="font-medium text-right">{result.offer_title}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Type</dt>
          <dd className="font-medium text-right">
            {PARTNER_OFFER_TYPE_LABELS[result.offer_type]}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Tampon ajouté</dt>
          <dd className="font-medium text-right">{result.stamp_added ? "Oui" : "Non"}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onNewScan}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-yunicity-primary px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-95"
        >
          Nouveau scan
        </button>
        <Link
          href="/passport-ops"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-emerald-300 bg-white px-5 py-3.5 text-base font-medium text-emerald-900 shadow-sm hover:bg-white/90"
        >
          Voir Passport Ops
        </Link>
      </div>
    </section>
  );
}
