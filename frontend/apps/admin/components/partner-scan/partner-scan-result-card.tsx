"use client";

import type { ScanPassportPreview, ScanRedeemableOffer } from "@yunicity/types";
import {
  PARTNER_OFFER_TYPE_LABELS,
  PASSPORT_TIER_LABELS,
  type PartnerScanPhase,
} from "@yunicity/utils";
import { CheckCircle2 } from "lucide-react";

interface PartnerScanResultCardProps {
  passport: ScanPassportPreview;
  offers: ScanRedeemableOffer[];
  selectedOfferId: string | null;
  phase: PartnerScanPhase;
  isRedeeming: boolean;
  canRedeem: boolean;
  onSelectOffer: (offerId: string) => void;
  onRedeem: () => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="text-sm font-medium text-stone-900">{value}</dd>
    </div>
  );
}

export function PartnerScanResultCard({
  passport,
  offers,
  selectedOfferId,
  phase,
  isRedeeming,
  canRedeem,
  onSelectOffer,
  onRedeem,
}: PartnerScanResultCardProps) {
  const tierLabel = PASSPORT_TIER_LABELS[passport.tier_code] ?? passport.tier_code;
  const showRedeemCta = phase === "resolved";

  return (
    <section
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="partner-scan-result-title"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="partner-scan-result-title" className="text-lg font-semibold text-stone-950">
            Résultat Passport
          </h2>
          <p className="text-sm text-stone-600">
            Vérifiez l&apos;identité et le statut avant validation.
          </p>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <Field label="Citoyen" value={passport.display_label} />
        <Field label="Numéro Passport" value={passport.passport_number} />
        <Field label="Ville" value={passport.city} />
        <Field label="Palier" value={tierLabel} />
        <Field label="Statut" value="Actif" />
        <Field label="Tampons" value="—" />
        <Field label="Dernière activité" value="—" />
      </dl>

      <div className="space-y-3 border-t border-stone-100 pt-4">
        <h3 className="text-sm font-semibold text-stone-900">Offres disponibles</h3>
        {offers.length === 0 ? (
          <p className="text-sm text-stone-600">
            Aucune offre partenaire n&apos;est disponible pour ce Passport.
          </p>
        ) : (
          <ul className="space-y-2">
            {offers.map((offer) => {
              const selected = selectedOfferId === offer.id;
              return (
                <li key={offer.id}>
                  <button
                    type="button"
                    onClick={() => onSelectOffer(offer.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-yunicity-primary bg-yunicity-primary-soft/40"
                        : "border-stone-200 bg-stone-50/50 hover:border-stone-300"
                    }`}
                  >
                    <p className="font-semibold text-stone-900">{offer.title}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {offer.organization_name} · {PARTNER_OFFER_TYPE_LABELS[offer.offer_type]}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showRedeemCta && offers.length > 0 ? (
        <button
          type="button"
          disabled={!canRedeem || isRedeeming}
          onClick={() => void onRedeem()}
          className="w-full rounded-xl bg-yunicity-primary px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
        >
          {isRedeeming ? "Validation…" : "Valider l'interaction"}
        </button>
      ) : null}
    </section>
  );
}
