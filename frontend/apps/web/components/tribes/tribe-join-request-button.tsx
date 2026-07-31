"use client";

import type { Tribe } from "@yunicity/types";
import { useState } from "react";

import { yunicityBtnPrimary } from "@/lib/brand-classes";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

/** Demandeur : bouton « Demander à rejoindre » sur une tribu privée + état « en attente ». */
export function TribeJoinRequestButton({ tribe }: { tribe: Tribe }) {
  const api = useYunicityApi();
  const [requested, setRequested] = useState(tribe.viewer_has_pending_join_request);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (requested) {
    return (
      <p className="text-sm text-neutral-600">
        Votre demande a été envoyée — elle est en attente de validation.
      </p>
    );
  }

  async function request() {
    setPending(true);
    setError(null);
    try {
      await api.tribes.createTribeJoinRequest(tribe.slug, tribe.city, {
        message: message.trim() || null,
      });
      setRequested(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demande impossible pour le moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        Cette tribu est privée. Demandez à la rejoindre — un organisateur validera.
      </p>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Un mot pour les organisateurs (optionnel)"
        className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-yunicity-primary focus:outline-none"
      />
      <button type="button" disabled={pending} onClick={() => void request()} className={yunicityBtnPrimary}>
        {pending ? "Envoi…" : "Demander à rejoindre"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
