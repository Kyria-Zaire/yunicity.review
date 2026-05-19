"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { ScanRedeemableOffer } from "@yunicity/types";
import { PARTNER_OFFER_TYPE_LABELS, humanizeScanError, isAuthError } from "@yunicity/utils";
import { useState } from "react";

export default function AdminPartnerScanPage() {
  const { scanApi } = useAuth();
  const [code, setCode] = useState("");
  const [qrSecret, setQrSecret] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [offers, setOffers] = useState<ScanRedeemableOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function resolveCode() {
    setIsBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await scanApi.resolvePassport({ qr_secret: code.trim() });
      setQrSecret(code.trim());
      setPreview(data.passport.display_label);
      setOffers(data.offers.filter((o) => !o.already_redeemed));
    } catch (err) {
      setError(isAuthError(err) ? humanizeScanError(err.code, err.message) : "Scan impossible.");
    } finally {
      setIsBusy(false);
    }
  }

  async function redeem(offerId: string) {
    setIsBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await scanApi.redeemOffer({
        offer_id: offerId,
        qr_secret: qrSecret,
      });
      setSuccess(result.message);
      setOffers((prev) => prev.filter((o) => o.id !== offerId));
    } catch (err) {
      setError(
        isAuthError(err) ? humanizeScanError(err.code, err.message) : "Validation impossible.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-sm font-medium text-amber-800/90">Sur place</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-900">Valider un Passport</h2>
        <p className="mt-2 text-sm text-stone-600">
          Saisie manuelle du code — pour le scan caméra, utilise l&apos;app mobile partenaire.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <label className="block text-sm font-medium text-stone-800">
          Code Passport
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="YNCP1:…"
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={isBusy || !code.trim()}
          onClick={() => void resolveCode()}
          className="w-full rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isBusy ? "Chargement…" : "Rechercher le citoyen"}
        </button>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{success}</p> : null}

      {preview ? (
        <section className="space-y-3">
          <h3 className="font-semibold text-stone-900">{preview}</h3>
          {offers.length === 0 ? (
            <p className="text-sm text-stone-600">Aucune offre disponible à valider.</p>
          ) : (
            offers.map((offer) => (
              <article
                key={offer.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <h4 className="font-semibold">{offer.title}</h4>
                <p className="mt-1 text-xs text-stone-500">
                  {offer.organization_name} · {PARTNER_OFFER_TYPE_LABELS[offer.offer_type]}
                </p>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void redeem(offer.id)}
                  className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-950"
                >
                  Valider cette offre
                </button>
              </article>
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
