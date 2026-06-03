"use client";

import type {
  AdminPartnerDetailResponse,
  AdminPartnerPatchPayload,
  OrganizationVisibility,
} from "@yunicity/types";
import { ORGANIZATION_VISIBILITY_SELECT_OPTIONS } from "@yunicity/utils";
import { useEffect, useState } from "react";

interface PartnerDetailSettingsPanelProps {
  data: AdminPartnerDetailResponse;
  isSubmitting: boolean;
  onPatch: (payload: AdminPartnerPatchPayload) => Promise<boolean>;
}

export function PartnerDetailSettingsPanel({
  data,
  isSubmitting,
  onPatch,
}: PartnerDetailSettingsPanelProps) {
  const { organization, partner_profile, capabilities } = data;

  const [visibility, setVisibility] = useState<OrganizationVisibility>(organization.visibility);
  const [isFeatured, setIsFeatured] = useState(partner_profile?.is_featured ?? false);
  const [publicLabel, setPublicLabel] = useState("");
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    setVisibility(organization.visibility);
    setIsFeatured(partner_profile?.is_featured ?? false);
    setPublicLabel("");
    setSettingsError(null);
  }, [organization.visibility, partner_profile?.is_featured, organization.id]);

  if (!capabilities.can_update_settings || !partner_profile) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSettingsError(null);

    const payload: AdminPartnerPatchPayload = {
      visibility,
      is_featured: isFeatured,
    };
    const trimmedLabel = publicLabel.trim();
    if (trimmedLabel) {
      payload.public_partner_label = trimmedLabel;
    }

    const ok = await onPatch(payload);
    if (!ok) {
      setSettingsError("Enregistrement impossible — voir le message d'erreur ci-dessus.");
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Réglages catalogue
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        PATCH limité : visibilité organisation, mise en avant, libellé catalogue. Le statut
        partenaire ne peut pas être modifié ici.
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Visibilité organisation</span>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as OrganizationVisibility)}
            disabled={isSubmitting}
            className="mt-1 w-full max-w-xs rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            {ORGANIZATION_VISIBILITY_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            disabled={isSubmitting}
          />
          <span className="font-medium text-stone-800">Mis en avant dans le catalogue</span>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Libellé catalogue</span>
          <input
            type="text"
            value={publicLabel}
            onChange={(e) => setPublicLabel(e.target.value)}
            maxLength={160}
            disabled={isSubmitting}
            placeholder="Saisir pour mettre à jour (non affiché dans cette fiche)"
            className="mt-1 w-full max-w-md rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </label>
        {settingsError ? <p className="text-sm text-rose-700">{settingsError}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {isSubmitting ? "Enregistrement…" : "Enregistrer les réglages"}
        </button>
      </form>
    </section>
  );
}
