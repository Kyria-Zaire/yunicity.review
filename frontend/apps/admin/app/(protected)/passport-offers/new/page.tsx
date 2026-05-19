"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { fromDatetimeLocalValue } from "@/lib/format";
import type { PartnerOfferType, VerifiedOrganizationOption } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const OFFER_TYPES: { value: PartnerOfferType; label: string }[] = [
  { value: "drink", label: "Boisson" },
  { value: "discount", label: "Réduction" },
  { value: "vip", label: "VIP" },
  { value: "gift", label: "Cadeau" },
  { value: "event_access", label: "Événement" },
  { value: "custom", label: "Sur mesure" },
];

export default function NewPassportOfferPage() {
  const router = useRouter();
  const { partnerOffersAdminApi } = useAuth();
  const [orgs, setOrgs] = useState<VerifiedOrganizationOption[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<PartnerOfferType>("drink");
  const [redemptionLimit, setRedemptionLimit] = useState(1);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrgs = useCallback(async () => {
    try {
      const data = await partnerOffersAdminApi.listVerifiedOrganizations();
      setOrgs(data.items);
      const first = data.items[0];
      if (first) {
        setOrganizationId(first.id);
      }
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger les organisations.");
    }
  }, [partnerOffersAdminApi]);

  useEffect(() => {
    void loadOrgs();
  }, [loadOrgs]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await partnerOffersAdminApi.createOffer({
        organization_id: organizationId,
        title: title.trim(),
        description: description.trim() || null,
        offer_type: offerType,
        redemption_limit: redemptionLimit,
        valid_from: validFrom ? fromDatetimeLocalValue(validFrom) : null,
        valid_until: validUntil ? fromDatetimeLocalValue(validUntil) : null,
      });
      router.push(`/passport-offers/${created.id}`);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Création impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href="/passport-offers" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour aux offres
        </Link>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Nouvelle offre Passport</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organisation vérifiée uniquement — brouillon par défaut recommandé.
        </p>
      </header>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <label className="block text-sm font-medium">
          Organisation vérifiée
          <select
            required
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} — {org.city}
              </option>
            ))}
          </select>
        </label>

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
          Limite de redemption / passport
          <input
            type="number"
            min={1}
            required
            value={redemptionLimit}
            onChange={(e) => setRedemptionLimit(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !organizationId}
          className="w-full rounded-xl bg-yunicity-primary py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Création…" : "Créer l'offre"}
        </button>
      </form>
    </div>
  );
}
