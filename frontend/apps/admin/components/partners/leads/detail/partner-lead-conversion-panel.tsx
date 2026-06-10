import { adminPartnerDetailPath } from "@yunicity/utils";
import Link from "next/link";
import { Building2 } from "lucide-react";

type PartnerLeadConversionPanelProps = {
  organizationId: string;
  convertedAt: string | null;
};

export function PartnerLeadConversionPanel({
  organizationId,
  convertedAt,
}: PartnerLeadConversionPanelProps) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
          <Building2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-stone-950">Partenaire intégré</h2>
          <p className="mt-1 text-sm text-stone-700">
            Ce prospect est devenu une organisation partenaire Yunicity.
            {convertedAt ? ` Conversion enregistrée.` : null}
          </p>
          <Link
            href={adminPartnerDetailPath(organizationId)}
            className="mt-3 inline-flex rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
          >
            Voir le partenaire
          </Link>
        </div>
      </div>
    </section>
  );
}
