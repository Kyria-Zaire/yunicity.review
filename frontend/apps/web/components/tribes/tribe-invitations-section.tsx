"use client";

import type { TribeInvitationPending } from "@yunicity/types";
import {
  TRIBE_CHARTER_LABEL,
  TRIBE_INVITATIONS_ACCEPT,
  TRIBE_INVITATIONS_SECTION_BODY,
  TRIBE_INVITATIONS_DECLINE,
  TRIBE_INVITATIONS_EMPTY,
  TRIBE_INVITATIONS_SECTION_TITLE,
  tribeHref,
} from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function TribeInvitationsSection() {
  const api = useYunicityApi();
  const [items, setItems] = useState<TribeInvitationPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.tribes.listMyTribeInvitations();
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [api.tribes]);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(invitation: TribeInvitationPending) {
    setBusyId(invitation.id);
    try {
      await api.tribes.acceptTribeInvitationById(invitation.id, { charter_accepted: true });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function decline(invitation: TribeInvitationPending) {
    setBusyId(invitation.id);
    try {
      await api.tribes.declineTribeInvitation(invitation.id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading || items.length === 0) {
    if (!loading && items.length === 0) {
      return null;
    }
    return loading ? (
      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">Chargement des invitations…</p>
      </section>
    ) : null;
  }

  return (
    <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-900">{TRIBE_INVITATIONS_SECTION_TITLE}</h2>
      <p className="mt-1 text-sm text-neutral-600">{TRIBE_INVITATIONS_SECTION_BODY}</p>
      <ul className="mt-4 space-y-3">
        {items.map((invitation) => (
          <li
            key={invitation.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-100 bg-yunicity-surface px-4 py-3"
          >
            <div>
              <p className="font-medium text-neutral-900">{invitation.tribe_name}</p>
              <p className="text-sm text-neutral-500">{invitation.tribe_city}</p>
              <p className="mt-1 text-xs text-neutral-500">{TRIBE_CHARTER_LABEL}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === invitation.id}
                onClick={() => void accept(invitation)}
                className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
              >
                {TRIBE_INVITATIONS_ACCEPT}
              </button>
              <button
                type="button"
                disabled={busyId === invitation.id}
                onClick={() => void decline(invitation)}
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
              >
                {TRIBE_INVITATIONS_DECLINE}
              </button>
              <Link
                href={tribeHref(invitation.tribe_slug, invitation.tribe_city)}
                className="self-center text-sm text-yunicity-primary hover:underline"
              >
                Voir
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TribeInvitationsEmptyHint() {
  return (
    <p className="mb-6 text-sm text-neutral-500">
      {TRIBE_INVITATIONS_EMPTY}{" "}
      <Link href="/tribes/invitation" className="text-yunicity-primary hover:underline">
        Lien d’invitation
      </Link>
    </p>
  );
}
