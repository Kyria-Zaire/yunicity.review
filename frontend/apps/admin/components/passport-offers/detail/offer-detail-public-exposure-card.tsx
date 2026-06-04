import type { PartnerOfferAdmin } from "@yunicity/types";
import {
  buildOfferPublicExposureChecks,
  isOfferPubliclyVisible,
} from "@yunicity/utils";

interface OfferDetailPublicExposureCardProps {
  offer: PartnerOfferAdmin;
}

function statusClasses(status: "ok" | "ko" | "unknown"): string {
  if (status === "ok") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (status === "ko") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }
  return "border-stone-200 bg-stone-50 text-stone-700";
}

function statusLabel(status: "ok" | "ko" | "unknown"): string {
  if (status === "ok") {
    return "OK";
  }
  if (status === "ko") {
    return "Bloquant";
  }
  return "Inconnu";
}

export function OfferDetailPublicExposureCard({ offer }: OfferDetailPublicExposureCardProps) {
  const checks = buildOfferPublicExposureChecks(offer);
  const visible = isOfferPubliclyVisible(offer);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Exposition publique
      </h2>
      <p className="mt-2 text-sm text-stone-700">
        {visible
          ? "Cette offre remplit les critères connus de visibilité citoyenne."
          : "Cette offre n'est probablement pas visible côté citoyen (critères non satisfaits)."}
      </p>
      <ul className="mt-4 space-y-2">
        {checks.map((check) => (
          <li
            key={check.key}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${statusClasses(check.status)}`}
          >
            <span className="font-medium">{check.label}</span>
            <span className="text-xs">
              {statusLabel(check.status)} · {check.detail}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
