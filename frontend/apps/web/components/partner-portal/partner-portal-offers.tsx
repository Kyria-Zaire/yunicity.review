"use client";

import { usePartnerPortalContext } from "@/hooks/use-partner-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { PartnerOfferManagement, PartnerOfferType } from "@yunicity/types";
import {
  isAuthError,
  partnerPortalOfferStatusLabel,
} from "@yunicity/utils";
import { useCallback, useMemo, useState } from "react";

const OFFER_TYPES: { value: PartnerOfferType; label: string }[] = [
  { value: "drink", label: "Boisson" },
  { value: "discount", label: "Réduction" },
  { value: "gift", label: "Cadeau" },
  { value: "event_access", label: "Événement" },
  { value: "custom", label: "Sur mesure" },
];

function canEditOffer(offer: PartnerOfferManagement): boolean {
  return offer.offer_status === "draft" || offer.offer_status === "rejected";
}

function canSubmitOffer(offer: PartnerOfferManagement): boolean {
  return offer.offer_status === "draft" || offer.offer_status === "rejected";
}

export function PartnerPortalOffers() {
  const ctx = usePartnerPortalContext();
  const api = useYunicityApi();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<PartnerOfferType>("custom");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const publicById = useMemo(() => {
    const map = new Map<string, (typeof ctx.publicOffers)[number]>();
    for (const item of ctx.publicOffers) {
      map.set(item.id, item);
    }
    return map;
  }, [ctx.publicOffers]);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setOfferType("custom");
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
  }, []);

  const startEdit = useCallback((offer: PartnerOfferManagement) => {
    setEditingId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description ?? "");
    setOfferType(offer.offer_type);
    setShowForm(true);
    setFormError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!ctx.organization || !title.trim()) {
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      if (editingId) {
        await api.partnerOffers.updateOffer(editingId, {
          title: title.trim(),
          description: description.trim() || null,
          offer_type: offerType,
        });
      } else {
        await api.partnerOffers.createOffer({
          organization_id: ctx.organization.id,
          title: title.trim(),
          description: description.trim() || null,
          offer_type: offerType,
        });
      }
      resetForm();
      await ctx.reload();
    } catch (err) {
      setFormError(isAuthError(err) ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }, [api.partnerOffers, ctx, description, editingId, offerType, resetForm, title]);

  const handleSubmit = useCallback(
    async (offerId: string) => {
      setBusy(true);
      setFormError(null);
      try {
        await api.partnerOffers.submitOffer(offerId);
        await ctx.reload();
      } catch (err) {
        setFormError(
          isAuthError(err) ? err.message : "Soumission impossible — vérifiez les champs.",
        );
      } finally {
        setBusy(false);
      }
    },
    [api.partnerOffers, ctx],
  );

  if (!ctx.organization) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          {ctx.offers.length} offre{ctx.offers.length !== 1 ? "s" : ""} en gestion
        </p>
        {ctx.canManage ? (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-xl bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Nouvelle offre
          </button>
        ) : null}
      </div>

      {showForm && ctx.canManage ? (
        <form
          className="space-y-4 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <h2 className="text-lg font-bold text-neutral-900">
            {editingId ? "Modifier l’offre" : "Créer une offre"}
          </h2>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">Titre</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-neutral-800">Type</span>
            <select
              value={offerType}
              onChange={(e) => setOfferType(e.target.value as PartnerOfferType)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
            >
              {OFFER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-neutral-500">
            Après enregistrement en brouillon, soumettez l’offre pour validation par l’équipe
            Yunicity avant publication sur le Passport.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Enregistrement…" : "Enregistrer le brouillon"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700"
            >
              Annuler
            </button>
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        </form>
      ) : null}

      {ctx.offers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
          Aucune offre pour le moment. Créez une offre brouillon puis soumettez-la pour validation.
        </p>
      ) : (
        <ul className="space-y-4">
          {ctx.offers.map((offer) => {
            const pub = publicById.get(offer.id);
            return (
              <li
                key={offer.id}
                className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold text-neutral-900">{offer.title}</h3>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                    {partnerPortalOfferStatusLabel(offer.offer_status)}
                  </span>
                </div>
                {offer.description ? (
                  <p className="mt-2 text-sm text-neutral-600">{offer.description}</p>
                ) : null}
                {pub?.value_label ? (
                  <p className="mt-2 text-sm font-medium text-yunicity-primary">{pub.value_label}</p>
                ) : null}
                {pub?.conditions ? (
                  <p className="mt-1 text-xs text-neutral-500">{pub.conditions}</p>
                ) : null}
                <p className="mt-2 text-xs text-neutral-500">
                  {offer.is_active ? "Active" : "Inactive"} · type {offer.offer_type}
                </p>
                {offer.rejection_reason ? (
                  <p className="mt-2 text-xs text-red-600">Motif : {offer.rejection_reason}</p>
                ) : null}
                {ctx.canManage && (canEditOffer(offer) || canSubmitOffer(offer)) ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canEditOffer(offer) ? (
                      <button
                        type="button"
                        onClick={() => startEdit(offer)}
                        className="text-xs font-semibold text-yunicity-primary hover:underline"
                      >
                        Modifier
                      </button>
                    ) : null}
                    {canSubmitOffer(offer) ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSubmit(offer.id)}
                        className="rounded-full border border-yunicity-primary/30 px-3 py-1 text-xs font-semibold text-yunicity-primary"
                      >
                        Soumettre pour validation
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
