"use client";

import type { OfferDetailFormState } from "@/lib/hooks/use-admin-offer-detail";
import type { PartnerOfferType } from "@yunicity/types";
import { PARTNER_OFFER_TYPE_LABELS } from "@yunicity/utils";

const OFFER_TYPES: { value: PartnerOfferType; label: string }[] = (
  Object.entries(PARTNER_OFFER_TYPE_LABELS) as [PartnerOfferType, string][]
).map(([value, label]) => ({ value, label }));

interface OfferDetailEditSectionProps {
  form: OfferDetailFormState;
  isSaving: boolean;
  saveError: string | null;
  onChange: (patch: Partial<OfferDetailFormState>) => void;
  onSave: () => Promise<boolean>;
}

export function OfferDetailEditSection({
  form,
  isSaving,
  saveError,
  onChange,
  onSave,
}: OfferDetailEditSectionProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Édition contenu (staff)
      </h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
        <label className="block text-sm font-medium text-stone-800">
          Titre
          <input
            required
            value={form.title}
            onChange={(event) => onChange({ title: event.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Description
          <textarea
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-stone-800">
          Type
          <select
            value={form.offerType}
            onChange={(event) => onChange({ offerType: event.target.value as PartnerOfferType })}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            {OFFER_TYPES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-stone-800">
            Valide du
            <input
              type="datetime-local"
              value={form.validFrom}
              onChange={(event) => onChange({ validFrom: event.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-stone-800">
            Valide jusqu&apos;au
            <input
              type="datetime-local"
              value={form.validUntil}
              onChange={(event) => onChange({ validUntil: event.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-stone-800">
          Limite / passport
          <input
            type="number"
            min={1}
            required
            value={form.redemptionLimit}
            onChange={(event) => onChange({ redemptionLimit: Number(event.target.value) })}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        {saveError ? <p className="text-sm text-rose-700">{saveError}</p> : null}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-yunicity-primary px-4 py-2 text-sm font-medium text-white hover:bg-yunicity-primary-hover disabled:opacity-50"
        >
          {isSaving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </section>
  );
}
