"use client";

import type { Tribe } from "@yunicity/types";
import { useState } from "react";

import { canManageTribe } from "@/hooks/use-tribe-members";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

const DESCRIPTION_MIN = 10;

/**
 * Édition owner : nom / description / cover / limite de membres. N'expose JAMAIS is_featured
 * (mise en avant = décision staff ; le backend la rejette aussi côté service). Owner uniquement.
 */
export function TribeEditForm({ tribe, city }: { tribe: Tribe; city: string }) {
  const api = useYunicityApi();
  const [name, setName] = useState(tribe.name);
  const [description, setDescription] = useState(tribe.description);
  const [coverImageUrl, setCoverImageUrl] = useState(tribe.cover_image_url ?? "");
  const [memberLimit, setMemberLimit] = useState(tribe.member_limit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManageTribe(tribe.viewer_role)) {
    return null;
  }

  const canSave = name.trim().length >= 2 && description.trim().length >= DESCRIPTION_MIN;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.tribes.updateTribe(tribe.slug, city, {
        name: name.trim(),
        description: description.trim(),
        cover_image_url: coverImageUrl.trim() || null,
        member_limit: memberLimit,
      });
      // Le nom/description apparaissent à plusieurs endroits : on recharge sur les valeurs à jour.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible.");
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Modifier la tribu</h3>
      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-neutral-600">Nom</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-yunicity-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-neutral-600">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={4000}
            className="mt-1 w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-yunicity-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-neutral-600">Image de couverture (URL)</span>
          <input
            value={coverImageUrl}
            onChange={(event) => setCoverImageUrl(event.target.value)}
            placeholder="https://…"
            maxLength={500}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-yunicity-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-neutral-600">Limite de membres</span>
          <input
            type="number"
            value={memberLimit}
            min={10}
            max={150}
            onChange={(event) => setMemberLimit(Number(event.target.value))}
            className="mt-1 w-32 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-yunicity-primary focus:outline-none"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={saving || !canSave}
        onClick={() => void save()}
        className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </section>
  );
}
