"use client";

import {
  fromDatetimeLocalValue,
  PartnerFlashFields,
} from "@/components/partner-flash-fields";
import { PartnerOfferAccessPanel } from "@/components/partner-offer-access-panel";
import {
  usePartnerOfferMutations,
  usePartnerOrganizations,
} from "@/lib/hooks/use-partner-offers";
import type { PartnerOfferType } from "@yunicity/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const OFFER_TYPES: { value: PartnerOfferType; label: string }[] = [
  { value: "drink", label: "Boisson" },
  { value: "discount", label: "Réduction" },
  { value: "vip", label: "VIP" },
  { value: "gift", label: "Cadeau" },
  { value: "event_access", label: "Événement" },
  { value: "custom", label: "Sur mesure" },
];

export default function NewPartnerOfferPage() {
  const router = useRouter();
  const { manageable, organizations, isLoading: orgLoading } = usePartnerOrganizations();
  const { create, submit, isBusy, error } = usePartnerOfferMutations();

  const [organizationId, setOrganizationId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<PartnerOfferType>("drink");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isFlash, setIsFlash] = useState(false);
  const [flashEndsAt, setFlashEndsAt] = useState("");
  const [submitAfterCreate, setSubmitAfterCreate] = useState(true);

  const defaultOrg = manageable[0]?.id ?? "";
  const orgId = organizationId || defaultOrg;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!orgId) {
      return;
    }
    const created = await create({
      organization_id: orgId,
      title: title.trim(),
      description: description.trim() || null,
      offer_type: offerType,
      valid_from: validFrom ? fromDatetimeLocalValue(validFrom) : null,
      valid_until: validUntil ? fromDatetimeLocalValue(validUntil) : null,
      is_flash: isFlash,
      flash_ends_at:
        isFlash && flashEndsAt ? fromDatetimeLocalValue(flashEndsAt) : null,
    });
    if (submitAfterCreate) {
      await submit(created.id);
    }
    router.push(`/partner-offers/${created.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/partner-offers" className="text-sm text-stone-500 hover:underline">
        ← Mes offres
      </Link>
      <header>
        <h2 className="text-2xl font-bold text-stone-900">Proposer une offre</h2>
        <p className="mt-1 text-sm text-stone-600">
          Quelques champs suffisent — Yunicity valide avant publication dans la ville.
        </p>
      </header>

      <PartnerOfferAccessPanel organizations={organizations} isLoading={orgLoading} />

      {manageable.length > 0 ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {manageable.length > 1 ? (
            <label className="block text-sm font-medium text-stone-800">
              Lieu
              <select
                required
                value={orgId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              >
                {manageable.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} · {org.city}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm font-medium text-stone-800">
            Titre
            <input
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Café offert aux détenteurs Passport"
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-stone-800">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ce que vivent les citoyens chez toi…"
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm font-medium text-stone-800">
            Type
            <select
              value={offerType}
              onChange={(e) => setOfferType(e.target.value as PartnerOfferType)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
            >
              {OFFER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-stone-800">
              Début
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-stone-800">
              Fin
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <PartnerFlashFields
            isFlash={isFlash}
            flashEndsAt={flashEndsAt}
            validUntil={validUntil}
            onIsFlashChange={setIsFlash}
            onFlashEndsAtChange={setFlashEndsAt}
          />

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={submitAfterCreate}
              onChange={(e) => setSubmitAfterCreate(e.target.checked)}
            />
            Envoyer à Yunicity pour validation après création
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isBusy || !orgId}
            className="w-full rounded-2xl bg-stone-900 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isBusy ? "Enregistrement…" : submitAfterCreate ? "Créer et soumettre" : "Enregistrer le brouillon"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
