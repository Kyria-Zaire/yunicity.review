"use client";

import type { Tribe } from "@yunicity/types";
import { tribeInvitationHref } from "@yunicity/utils";
import { useState } from "react";

import { canManageTribe } from "@/hooks/use-tribe-members";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function TribeModerationPanel({ tribe, city }: { tribe: Tribe; city: string }) {
  const api = useYunicityApi();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManageTribe(tribe.viewer_role) && tribe.viewer_role !== "moderator") {
    return null;
  }

  async function createInvitation() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.tribes.createTribeInvitation(tribe.slug, city);
      const path = tribeInvitationHref(response.token);
      setInviteLink(`${window.location.origin}${path}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invitation impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-neutral-200 bg-yunicity-surface p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Coordination</h3>
      <p className="mt-1 text-xs text-neutral-600">
        Invitation personnelle — pas de diffusion massive.
      </p>
      {canManageTribe(tribe.viewer_role) ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void createInvitation()}
          className="mt-3 rounded-full border border-yunicity-primary px-4 py-2 text-sm font-medium text-yunicity-primary hover:bg-white"
        >
          {loading ? "Création…" : "Créer un lien d’invitation"}
        </button>
      ) : null}
      {inviteLink ? (
        <p className="mt-3 break-all text-xs text-neutral-700">
          Lien à partager en privé :{" "}
          <a href={inviteLink} className="text-yunicity-primary underline">
            {inviteLink}
          </a>
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </section>
  );
}
