"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { OrganizationType, PartnerLeadSource } from "@yunicity/types";
import { ORGANIZATION_TYPE_OPTIONS, PARTNER_LEAD_SOURCE_LABELS, isAuthError } from "@yunicity/utils";
import { X } from "lucide-react";
import { useState } from "react";

type PartnerLeadsCreateModalProps = {
  city: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function PartnerLeadsCreateModal({
  city,
  open,
  onClose,
  onCreated,
}: PartnerLeadsCreateModalProps) {
  const { partnerLeadsApi } = useAuth();
  const [name, setName] = useState("");
  const [leadCity, setLeadCity] = useState(city);
  const [source, setSource] = useState<PartnerLeadSource>("physical_prospecting");
  const [organizationType, setOrganizationType] = useState<OrganizationType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await partnerLeadsApi.createPartnerLead({
        name: trimmed,
        city: leadCity.trim() || city,
        source,
        organization_type: organizationType || null,
      });
      setName("");
      setLeadCity(city);
      setSource("physical_prospecting");
      setOrganizationType("");
      onCreated();
      onClose();
    } catch (err) {
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible d'enregistrer ce prospect. Vérifiez les informations.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-prospect-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="create-prospect-title" className="text-lg font-bold text-stone-950">
              Ajouter un prospect
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Enregistrez un contact terrain pour le pipeline {city}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-500 hover:bg-stone-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Nom du prospect *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              placeholder="Ex. Café du Parc"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Ville</span>
            <input
              value={leadCity}
              onChange={(e) => setLeadCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Type</span>
            <select
              value={organizationType}
              onChange={(e) => setOrganizationType(e.target.value as OrganizationType | "")}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="">Non précisé</option>
              {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Source</span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as PartnerLeadSource)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              {(Object.entries(PARTNER_LEAD_SOURCE_LABELS) as [PartnerLeadSource, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
