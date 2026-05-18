"use client";

import { OfferStatusBadge } from "@/components/offer-status-badge";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/format";
import type {
  PartnerOfferAdmin,
  PartnerOfferAdminUpdatePayload,
  PartnerOfferType,
} from "@yunicity/types";
import { PARTNER_OFFER_STATUS_MICROCOPY, isAuthError } from "@yunicity/utils";
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

function applyOfferToForm(offer: PartnerOfferAdmin) {
  return {
    title: offer.title,
    description: offer.description ?? "",
    offerType: offer.offer_type,
    redemptionLimit: offer.redemption_limit,
    validFrom: toDatetimeLocalValue(offer.valid_from),
    validUntil: toDatetimeLocalValue(offer.valid_until),
  };
}

export default function PassportOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const offerId = params.id;
  const { partnerOffersAdminApi } = useAuth();

  const [offer, setOffer] = useState<PartnerOfferAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<PartnerOfferType>("drink");
  const [redemptionLimit, setRedemptionLimit] = useState(1);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const syncForm = useCallback((data: PartnerOfferAdmin) => {
    const form = applyOfferToForm(data);
    setTitle(form.title);
    setDescription(form.description);
    setOfferType(form.offerType);
    setRedemptionLimit(form.redemptionLimit);
    setValidFrom(form.validFrom);
    setValidUntil(form.validUntil);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await partnerOffersAdminApi.getOffer(offerId);
      setOffer(data);
      syncForm(data);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Offre introuvable.");
    } finally {
      setIsLoading(false);
    }
  }, [partnerOffersAdminApi, offerId, syncForm]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!offer) {
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const payload: PartnerOfferAdminUpdatePayload = {
      title: title.trim(),
      description: description.trim() || null,
      offer_type: offerType,
      redemption_limit: redemptionLimit,
      valid_from: validFrom ? fromDatetimeLocalValue(validFrom) : null,
      valid_until: validUntil ? fromDatetimeLocalValue(validUntil) : null,
    };
    try {
      const updated = await partnerOffersAdminApi.updateOffer(offer.id, payload);
      setOffer(updated);
      syncForm(updated);
    } catch (err) {
      setSaveError(isAuthError(err) ? err.message : "Enregistrement impossible.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApprove() {
    if (!offer) {
      return;
    }
    setIsModerating(true);
    setActionError(null);
    try {
      const updated = await partnerOffersAdminApi.approveOffer(offer.id);
      setOffer(updated);
      syncForm(updated);
      setShowReject(false);
    } catch (err) {
      setActionError(isAuthError(err) ? err.message : "Approbation impossible.");
    } finally {
      setIsModerating(false);
    }
  }

  async function handleReject() {
    if (!offer || !rejectReason.trim()) {
      return;
    }
    setIsModerating(true);
    setActionError(null);
    try {
      const updated = await partnerOffersAdminApi.rejectOffer(offer.id, {
        reason: rejectReason.trim(),
      });
      setOffer(updated);
      syncForm(updated);
      setShowReject(false);
      setRejectReason("");
    } catch (err) {
      setActionError(isAuthError(err) ? err.message : "Refus impossible.");
    } finally {
      setIsModerating(false);
    }
  }

  async function handleArchive() {
    if (!offer) {
      return;
    }
    setIsModerating(true);
    setActionError(null);
    try {
      const updated = await partnerOffersAdminApi.archiveOffer(offer.id);
      setOffer(updated);
      syncForm(updated);
    } catch (err) {
      setActionError(isAuthError(err) ? err.message : "Archivage impossible.");
    } finally {
      setIsModerating(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement de l&apos;offre…</p>;
  }

  if (error || !offer) {
    return (
      <div className="space-y-4">
        <Link href="/passport-offers" className="text-sm text-muted-foreground hover:underline">
          ← Modération offres
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? "Offre introuvable."}
        </div>
      </div>
    );
  }

  const canApprove = offer.offer_status === "pending_review";
  const canReject = offer.offer_status === "pending_review" || offer.offer_status === "published";
  const canArchive =
    offer.offer_status === "published" ||
    offer.offer_status === "rejected" ||
    offer.offer_status === "draft";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/passport-offers" className="text-sm text-muted-foreground hover:underline">
        ← Modération offres
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{offer.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {offer.organization.name} · {offer.organization.city}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {PARTNER_OFFER_STATUS_MICROCOPY[offer.offer_status]}
          </p>
        </div>
        <OfferStatusBadge status={offer.offer_status} />
      </header>

      {offer.rejection_reason ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Dernier refus : {offer.rejection_reason}
        </p>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Modération
        </h3>
        {actionError ? <p className="mt-2 text-sm text-red-600">{actionError}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {canApprove ? (
            <button
              type="button"
              disabled={isModerating}
              onClick={() => void handleApprove()}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              Approuver (publier)
            </button>
          ) : null}
          {canReject ? (
            <button
              type="button"
              disabled={isModerating}
              onClick={() => setShowReject((v) => !v)}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-900"
            >
              Refuser
            </button>
          ) : null}
          {canArchive ? (
            <button
              type="button"
              disabled={isModerating}
              onClick={() => void handleArchive()}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              Archiver
            </button>
          ) : null}
        </div>
        {showReject ? (
          <div className="mt-4 space-y-2">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du refus (visible partenaire)…"
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={isModerating || !rejectReason.trim()}
              onClick={() => void handleReject()}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Confirmer le refus
            </button>
          </div>
        ) : null}
      </section>

      <form
        onSubmit={(e) => void handleSave(e)}
        className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold">Contenu (staff)</h3>
        <label className="block text-sm font-medium">
          Titre
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium">
          Type
          <select
            value={offerType}
            onChange={(e) => setOfferType(e.target.value as PartnerOfferType)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
            Valide du
            <input
              type="datetime-local"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium">
            Valide jusqu&apos;au
            <input
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Limite / passport
          <input
            type="number"
            min={1}
            required
            value={redemptionLimit}
            onChange={(e) => setRedemptionLimit(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSaving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <p className="text-xs text-muted-foreground">
        {offer.redemptions_count} redemption(s) · Créée {formatDateTime(offer.created_at)}
      </p>
    </div>
  );
}
