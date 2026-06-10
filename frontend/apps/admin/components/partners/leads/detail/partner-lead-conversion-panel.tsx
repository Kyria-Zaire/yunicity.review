import {
  adminPartnerDetailPath,
  buildPassportOpsListPath,
  partnerLeadConversionPanelCopy,
} from "@yunicity/utils";
import { Building2, IdCard, Users } from "lucide-react";
import Link from "next/link";

type PartnerLeadConversionPanelProps = {
  organizationId: string;
  convertedAt: string | null;
};

export function PartnerLeadConversionPanel({
  organizationId,
  convertedAt,
}: PartnerLeadConversionPanelProps) {
  const copy = partnerLeadConversionPanelCopy();

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
          <Building2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-stone-950">Partenaire activé</h2>
            <p className="mt-1 text-sm text-stone-700">
              Ce partenaire contribue désormais au réseau Yunicity.
              {convertedAt ? ` Intégration enregistrée.` : null}
            </p>
            <Link
              href={adminPartnerDetailPath(organizationId)}
              className="mt-3 inline-flex rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
            >
              Voir la fiche partenaire
            </Link>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              {copy.title}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-emerald-200/80 bg-white/80 p-3">
                <div className="flex items-start gap-2">
                  <IdCard className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900">{copy.passportTitle}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">
                      {copy.passportDescription}
                    </p>
                    <Link
                      href={buildPassportOpsListPath()}
                      className="mt-2 inline-flex text-xs font-medium text-yunicity-primary hover:underline"
                    >
                      {copy.passportCta} →
                    </Link>
                  </div>
                </div>
              </article>
              <article className="rounded-xl border border-emerald-200/80 bg-white/80 p-3">
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900">{copy.networkTitle}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">
                      {copy.networkDescription}
                    </p>
                    <Link
                      href="/partners"
                      className="mt-2 inline-flex text-xs font-medium text-yunicity-primary hover:underline"
                    >
                      {copy.networkCta} →
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
