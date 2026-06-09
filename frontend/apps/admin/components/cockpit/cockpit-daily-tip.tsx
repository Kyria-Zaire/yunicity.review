import type { AdminCockpitAttention } from "@yunicity/types";
import { formatAdminMetric } from "@yunicity/utils";
import { Lightbulb } from "lucide-react";
import Link from "next/link";

export function CockpitDailyTip({ attention }: { attention: AdminCockpitAttention }) {
  const pending = attention.offers_pending;

  if (pending <= 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-yunicity-primary/20 bg-yunicity-primary-soft px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-yunicity-primary shadow-sm">
            <Lightbulb className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-900">Conseil du jour</p>
            <p className="mt-0.5 text-sm text-stone-700">
              <strong>{formatAdminMetric(pending)} offre{pending > 1 ? "s" : ""}</strong> en attente
              de validation — traitez la file pour alimenter Passport et feed local.
            </p>
          </div>
        </div>
        <Link
          href="/passport-offers?status=pending_review"
          className="shrink-0 rounded-lg bg-yunicity-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-yunicity-primary-hover"
        >
          Voir les offres en attente →
        </Link>
      </div>
    </section>
  );
}
