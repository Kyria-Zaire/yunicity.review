"use client";

import type { OrganizationRequestPayload, OrganizationType } from "@yunicity/types";
import { ORGANIZATION_TYPE_OPTIONS, isAuthError } from "@yunicity/utils";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

const SUCCESS_MESSAGE =
  "Votre demande est en cours de vérification par l'équipe Yunicity.";

export function OrganizationRequestForm() {
  const api = useYunicityApi();
  const [name, setName] = useState("");
  const [type, setType] = useState<OrganizationType>("commerce");
  const [city, setCity] = useState("Reims");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const payload: OrganizationRequestPayload = {
      name: name.trim(),
      type,
      city: city.trim(),
      address: address.trim() || undefined,
      website: website.trim() || undefined,
      instagram: instagram.trim() || undefined,
      description: description.trim() || undefined,
    };
    try {
      await api.createOrganizationRequest(payload);
      setSubmitted(true);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible d'envoyer la demande.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow-sm">
        <p className="text-lg font-semibold text-emerald-900">Demande envoyée</p>
        <p className="text-sm text-emerald-800">{SUCCESS_MESSAGE}</p>
        <p className="text-xs text-emerald-700">
          Ton lieu reste privé et en attente — pas de publication automatique.
        </p>
        <Link
          href="/organizations/me"
          className="inline-block rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Voir mes lieux
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm"
    >
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-sm text-neutral-600">
        Quelques infos suffisent. La vérification arrive ensuite — pas de paperasse pour
        l&apos;instant.
      </p>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-neutral-800">Nom du lieu</span>
        <input
          required
          maxLength={160}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          placeholder="Ex. Café du Parc"
        />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-neutral-800">Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as OrganizationType)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
        >
          {ORGANIZATION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-neutral-800">Ville</span>
        <input
          required
          maxLength={128}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
        />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-neutral-800">Adresse</span>
        <input
          maxLength={255}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
          placeholder="Rue, quartier…"
        />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-neutral-800">Site web</span>
        <input
          maxLength={2048}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
          placeholder="https://…"
        />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-neutral-800">Instagram</span>
        <input
          maxLength={128}
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
          placeholder="@compte ou lien"
        />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-neutral-800">Description courte</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-neutral-900"
          placeholder="En quelques mots, ce que vous proposez à Reims."
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {isSubmitting ? "Envoi…" : "Envoyer la demande"}
      </button>
    </form>
  );
}
