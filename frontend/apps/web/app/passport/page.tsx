"use client";

import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { usePassport } from "@/hooks/use-passport";
import { usePassportOffers } from "@/hooks/use-passport-offers";
import { usePassportStamps } from "@/hooks/use-passport-stamps";
import {
  PARTNER_OFFER_TYPE_LABELS,
  PASSPORT_TIER_META,
  formatPassportDate,
  maskQrToken,
} from "@yunicity/utils";
import type { ReactNode } from "react";

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function PassportWebContent() {
  const { passport, profile, error, isLoading, isActivating, activate } = usePassport();
  const hasPassport = passport !== null;
  const { stamps, isLoading: stampsLoading } = usePassportStamps(hasPassport);
  const { offers, isLoading: offersLoading, redeem, redeemingId, message } =
    usePassportOffers(hasPassport);

  if (isLoading) {
    return <p className="text-neutral-500">Chargement du passeport…</p>;
  }

  if (!hasPassport) {
    return (
      <Card>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
          Territoire · Identité
        </p>
        <h2 className="mt-2 text-2xl font-bold text-neutral-900">
          Active ton passeport Yunicity
        </h2>
        <p className="mt-2 text-neutral-600">
          Identité citoyenne locale, tampons et offres partenaires vérifiées — sans paiement.
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => void activate()}
          disabled={isActivating}
          className="mt-6 rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {isActivating ? "Activation…" : "Activer mon passeport Yunicity"}
        </button>
      </Card>
    );
  }

  const tier = PASSPORT_TIER_META[passport.tier.code];
  const name = profile?.display_name ?? profile?.username ?? "Citoyen";

  return (
    <div className="space-y-8">
      <Card className="border-amber-200/60 bg-gradient-to-br from-stone-900 to-stone-800 text-stone-50 shadow-md">
        <p className="text-xs font-bold tracking-[0.25em] text-amber-400">YUNICITY PASSPORT</p>
        <p className="mt-2 font-mono text-sm text-stone-300">{passport.passport_number}</p>
        <h2 className="mt-4 text-2xl font-bold">{name}</h2>
        <p className="text-stone-400">{passport.city}</p>
        <span
          className="mt-3 inline-block rounded-full border px-3 py-1 text-xs font-semibold"
          style={{ borderColor: tier.border, color: tier.accent, backgroundColor: tier.accentMuted }}
        >
          {tier.label}
        </span>
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="font-bold">{passport.stats.stamps_count}</p>
            <p className="text-stone-500">Tampons</p>
          </div>
          <div>
            <p className="font-bold">{passport.stats.redemptions_count}</p>
            <p className="text-stone-500">Offres</p>
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">
              {formatPassportDate(passport.activated_at)}
            </p>
            <p className="text-stone-500">Activé</p>
          </div>
        </div>
        <div className="mt-6 rounded-lg bg-white p-4 text-center">
          <div className="mx-auto grid w-24 grid-cols-6 gap-0.5">
            {Array.from({ length: 36 }).map((_, index) => (
              <div
                key={index}
                className={`aspect-square rounded-sm ${index % 3 === 0 ? "bg-stone-900" : "bg-transparent"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs uppercase text-stone-500">QR — scan à venir</p>
          <p className="font-mono text-xs text-stone-600">{maskQrToken(passport.qr_token)}</p>
        </div>
      </Card>

      <section>
        <h3 className="font-semibold text-neutral-900">Tampons</h3>
        {stampsLoading ? (
          <p className="mt-2 text-sm text-neutral-500">Chargement…</p>
        ) : stamps.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Aucun tampon pour l&apos;instant.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {stamps.map((stamp) => (
              <li
                key={stamp.id}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm"
              >
                <p className="font-medium">{stamp.organization.name}</p>
                <p className="text-neutral-500">
                  {stamp.organization.city} · {formatPassportDate(stamp.stamped_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-semibold text-neutral-900">Offres</h3>
        {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
        {offersLoading ? (
          <p className="mt-2 text-sm text-neutral-500">Chargement…</p>
        ) : offers.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Aucune offre disponible.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {offers.map((offer) => (
              <li key={offer.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-amber-800">
                  {PARTNER_OFFER_TYPE_LABELS[offer.offer_type]}
                </p>
                <p className="font-semibold">{offer.title}</p>
                <p className="text-sm text-neutral-500">{offer.organization.name}</p>
                <button
                  type="button"
                  onClick={() => void redeem(offer.id)}
                  disabled={redeemingId === offer.id}
                  className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {redeemingId === offer.id ? "…" : "Utiliser"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function PassportPage() {
  return (
    <ProtectedRoute>
      <AppShell title="Passport" subtitle="Identité citoyenne Yunicity">
        <PassportWebContent />
      </AppShell>
    </ProtectedRoute>
  );
}
