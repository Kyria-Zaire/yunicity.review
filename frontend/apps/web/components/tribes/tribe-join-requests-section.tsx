"use client";

import type { Tribe, TribeJoinRequestItem } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { canManageTribe } from "@/hooks/use-tribe-members";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

/** Owner/mod : liste des demandes d'adhésion en attente + accepter / refuser. */
export function TribeJoinRequestsSection({ tribe, city }: { tribe: Tribe; city: string }) {
  const api = useYunicityApi();
  const [items, setItems] = useState<TribeJoinRequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canModerate = canManageTribe(tribe.viewer_role) || tribe.viewer_role === "moderator";
  const active = canModerate && tribe.visibility === "private_invite" && !tribe.is_archived;

  const load = useCallback(async () => {
    if (!active) return;
    try {
      const response = await api.tribes.listTribeJoinRequests(tribe.slug, city);
      setItems(response.items);
    } catch {
      /* silencieux : une erreur ponctuelle ne casse pas la page */
    }
  }, [active, api.tribes, tribe.slug, city]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, accept: boolean) {
    setError(null);
    try {
      if (accept) {
        await api.tribes.acceptTribeJoinRequest(tribe.slug, city, id);
      } else {
        await api.tribes.declineTribeJoinRequest(tribe.slug, city, id);
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible pour le moment.");
    }
  }

  if (!active || items.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-neutral-900">Demandes en attente</h3>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-neutral-200 p-3">
            <p className="text-sm font-medium text-neutral-900">{item.requester_name}</p>
            {item.message ? (
              <p className="mt-1 text-xs text-neutral-600">{item.message}</p>
            ) : null}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => void decide(item.id, true)}
                className="rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
              >
                Accepter
              </button>
              <button
                type="button"
                onClick={() => void decide(item.id, false)}
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </section>
  );
}
