"use client";

import { OfferStatusBadge } from "@/components/offer-status-badge";
import { formatDate, fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";
import { usePartnerOfferMutations } from "@/lib/hooks/use-partner-offers";
import { useAuth } from "@/lib/auth/auth-provider";
import type { PartnerOfferManagement, PartnerOfferType } from "@yunicity/types";
import {
  PARTNER_OFFER_REJECTED_HINT,
  PARTNER_OFFER_REJECTED_REASON_LABEL,
  PARTNER_OFFER_REJECTED_SECTION_TITLE,
  PARTNER_OFFER_STATUS_MICROCOPY,
  PARTNER_OFFER_TYPE_LABELS,
  canEditPartnerOffer,
  canSubmitPartnerOffer,
  isAuthError,
} from "@yunicity/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const OFFER_TYPES: { value: PartnerOfferType; label: string }[] = [
  { value: "drink", label: "Boisson" },
  { value: "discount", label: "Réduction" },
  { value: "vip", label: "VIP" },
  { value: "gift", label: "Cadeau" },
  { value: "event_access", label: "Événement" },
  { value: "custom", label: "Sur mesure" },
];

export default function PartnerOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const offerId = params.id;
  const { partnerOffersApi } = useAuth();
  const { update, submit, isBusy, error, clearError } = usePartnerOfferMutations();

  const [offer, setOffer] = useState<PartnerOfferManagement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<PartnerOfferType>("drink");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await partnerOffersApi.listOffers({ page_size: 100 });
      const found = data.items.find((o) => o.id === offerId);
      if (!found) {
        setLoadError("Offre introuvable.");
        setOffer(null);
        return;
      }
      setOffer(found);
      setTitle(found.title);
      setDescription(found.description ?? "");
      setOfferType(found.offer_type);
      setValidFrom(toDatetimeLocalValue(found.valid_from));
      setValidUntil(toDatetimeLocalValue(found.valid_until));
    } catch (err) {
      setLoadError(isAuthError(err) ? err.message : "Chargement impossible.");
    } finally {
      setIsLoading(false);
    }
  }, [partnerOffersApi, offerId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!offer) {
      return;
    }
    clearError();
    setSaveOk(false);
    const updated = await update(offer.id, {
      title: title.trim(),
      description: description.trim() || null,
      offer_type: offerType,
      valid_from: validFrom ? fromDatetimeLocalValue(validFrom) : null,
      valid_until: validUntil ? fromDatetimeLocalValue(validUntil) : null,
    });
    setOffer(updated);
    setSaveOk(true);
  }

  async function handleSubmitReview() {
    if (!offer) {
      return;
    }
    clearError();
    const updated = await submit(offer.id);
    setOffer(updated);
    setSaveOk(true);
  }

  if (isLoading) {
    return <p className="text-sm text-stone-500">Chargement…</p>;
  }

  if (loadError || !offer) {
    return (
      <div className="space-y-4">
        <Link href="/partner-offers" className="text-sm text-stone-500 hover:underline">
          ← Mes offres
        </Link>
        <p className="text-sm text-red-600">{loadError ?? "Offre introuvable."}</p>
      </div>
    );
  }

  const editable = canEditPartnerOffer(offer.offer_status);
  const submittable = canSubmitPartnerOffer(offer.offer_status);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/partner-offers" className="text-sm text-stone-500 hover:underline">
        ← Mes offres
      </Link>

      <header className="space-y-2">
        <OfferStatusBadge status={offer.offer_status} />
        <h2 className="text-2xl font-bold text-stone-900">{offer.title}</h2>
        <p className="text-sm text-stone-600">
          {PARTNER_OFFER_STATUS_MICROCOPY[offer.offer_status]}
        </p>
        <p className="text-xs text-stone-400">
          {PARTNER_OFFER_TYPE_LABELS[offer.offer_type]} · {offer.redemptions_count} utilisation
          {offer.redemptions_count !== 1 ? "s" : ""}
        </p>
      </header>

      {offer.offer_status === "rejected" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
          <p className="font-medium">{PARTNER_OFFER_REJECTED_SECTION_TITLE}</p>
          {offer.rejection_reason ? (
            <>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-800/80">
                {PARTNER_OFFER_REJECTED_REASON_LABEL}
              </p>
              <p className="mt-1">{offer.rejection_reason}</p>
            </>
          ) : null}
          <p className="mt-2 text-xs text-amber-900/80">{PARTNER_OFFER_REJECTED_HINT}</p>
        </section>
      ) : null}

      {editable ? (
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
          <label className="block text-sm font-medium">
            Titre
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium">
            Type
            <select
              value={offerType}
              onChange={(e) => setOfferType(e.target.value as PartnerOfferType)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            >
              {OFFER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Début
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium">
              Fin
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {saveOk ? <p className="text-sm text-emerald-700">Enregistré.</p> : null}
          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isBusy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      ) : (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
          <p>{offer.description || "Pas de description."}</p>
          <p className="mt-2 text-xs text-stone-400">
            Validité : {offer.valid_from ? formatDate(offer.valid_from) : "—"} →{" "}
            {offer.valid_until ? formatDate(offer.valid_until) : "—"}
          </p>
        </section>
      )}

      {submittable ? (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void handleSubmitReview()}
          className="w-full rounded-2xl border border-amber-300 bg-amber-50 py-3 text-sm font-semibold text-amber-950 disabled:opacity-50"
        >
          {isBusy ? "Envoi…" : "Soumettre à Yunicity pour validation"}
        </button>
      ) : null}
    </div>
  );
}
