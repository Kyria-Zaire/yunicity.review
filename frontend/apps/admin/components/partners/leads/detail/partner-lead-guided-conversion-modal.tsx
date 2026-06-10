"use client";

import { LeadStatusBadge } from "@/components/lead-status-badge";
import type { AuthUser, ConvertLeadPayload, PartnerLead } from "@yunicity/types";
import {
  organizationTypeLabel,
  partnerLeadConvertErrorMessage,
  partnerLeadStatusLabel,
} from "@yunicity/utils";
import { Building2, Network, Sparkles } from "lucide-react";
import { useState } from "react";

type PartnerLeadGuidedConversionModalProps = {
  lead: PartnerLead;
  currentUser: AuthUser;
  onClose: () => void;
  onSubmit: (payload: ConvertLeadPayload) => Promise<void>;
};

export function PartnerLeadGuidedConversionModal({
  lead,
  currentUser,
  onClose,
  onSubmit,
}: PartnerLeadGuidedConversionModalProps) {
  const [useAlternateOwner, setUseAlternateOwner] = useState(false);
  const [alternateOwnerRef, setAlternateOwnerRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerUserId = useAlternateOwner ? alternateOwnerRef.trim() : currentUser.id;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!ownerUserId) {
      setError("Indiquez le responsable qui administrera ce partenaire.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ owner_user_id: ownerUserId });
    } catch (err) {
      setError(partnerLeadConvertErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-conversion-title"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
          Assistant d&apos;intégration
        </p>
        <h2 id="guided-conversion-title" className="mt-2 text-xl font-bold text-stone-950">
          Intégrer « {lead.name} » au réseau
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          Vous êtes sur le point d&apos;accueillir officiellement un nouveau partenaire Yunicity.
        </p>

        <div className="mt-5 rounded-xl border border-yunicity-primary/15 bg-yunicity-primary-soft/25 p-4">
          <p className="text-sm font-medium text-stone-900">Ce que vous allez faire :</p>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            <li className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              Créer une organisation partenaire
            </li>
            <li className="flex items-start gap-2">
              <Network className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              Intégrer ce commerce au réseau Yunicity
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              Rendre possibles les futures activations Passport
            </li>
          </ul>
        </div>

        <dl className="mt-5 grid gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Prospect</dt>
            <dd className="mt-1 text-sm font-medium text-stone-900">{lead.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Ville</dt>
            <dd className="mt-1 text-sm font-medium text-stone-900">{lead.city ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Type</dt>
            <dd className="mt-1 text-sm font-medium text-stone-900">
              {lead.organization_type
                ? organizationTypeLabel(lead.organization_type)
                : "Non renseigné"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Statut</dt>
            <dd className="mt-1">
              <LeadStatusBadge status={lead.status} />
              <span className="sr-only">{partnerLeadStatusLabel(lead.status)}</span>
            </dd>
          </div>
        </dl>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <fieldset className="rounded-xl border border-stone-200 bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-stone-900">
              Responsable du partenaire
            </legend>
            <p className="mt-1 text-sm text-stone-600">
              Choisissez la personne qui administrera ce partenaire au quotidien.
            </p>

            {!useAlternateOwner ? (
              <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
                <p className="text-sm font-medium text-stone-900">{currentUser.full_name}</p>
                <p className="text-sm text-stone-600">{currentUser.email}</p>
              </div>
            ) : (
              <label className="mt-3 block text-sm">
                <span className="font-medium text-stone-800">Référence du compte administrateur</span>
                <input
                  type="text"
                  required
                  value={alternateOwnerRef}
                  onChange={(e) => setAlternateOwnerRef(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
                  placeholder="Saisir la référence fournie par l'équipe"
                  autoComplete="off"
                />
                <p className="mt-1.5 text-xs text-stone-500">
                  Demandez la référence à un administrateur si le responsable n&apos;est pas vous.
                </p>
              </label>
            )}

            <button
              type="button"
              onClick={() => {
                setUseAlternateOwner((prev) => !prev);
                setAlternateOwnerRef("");
                setError(null);
              }}
              className="mt-3 text-sm font-medium text-yunicity-primary hover:underline"
            >
              {useAlternateOwner ? "Utiliser mon compte" : "Désigner un autre responsable"}
            </button>
          </fieldset>

          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
            Le partenaire restera <strong>en attente de validation</strong> — pas de visibilité
            publique immédiate.
          </p>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? "Intégration en cours…" : "Intégrer au réseau"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
