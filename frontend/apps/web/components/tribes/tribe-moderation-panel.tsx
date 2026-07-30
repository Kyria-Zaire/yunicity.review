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
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  if (!canManageTribe(tribe.viewer_role) && tribe.viewer_role !== "moderator") {
    return null;
  }

  async function createInvitation() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.tribes.createTribeInvitation(tribe.slug, city);
      const path = tribeInvitationHref(response.token, tribe.slug, city);
      setInviteLink(`${window.location.origin}${path}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invitation impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function archive() {
    setArchiving(true);
    setError(null);
    try {
      await api.tribes.archiveTribe(tribe.slug, city);
      // Action terminale : on recharge sur la vue archivée du détail.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archivage impossible.");
      setArchiving(false);
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
      {canManageTribe(tribe.viewer_role) ? (
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-semibold text-neutral-900">Archiver la tribu</h3>
          <p className="mt-1 text-xs text-neutral-600">
            L’archivage ferme la tribu : plus de nouveaux membres, le contenu reste consultable.
            Cette action est irréversible.
          </p>
          {!confirmArchive ? (
            <button
              type="button"
              onClick={() => setConfirmArchive(true)}
              className="mt-3 rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Archiver la tribu
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={archiving}
                onClick={() => void archive()}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {archiving ? "Archivage…" : "Confirmer l’archivage (irréversible)"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmArchive(false)}
                className="text-sm text-neutral-500 hover:text-neutral-800"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </section>
  );
}
