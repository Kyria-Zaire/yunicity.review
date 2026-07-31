"use client";

import type { Tribe } from "@yunicity/types";
import { TRIBE_CHARTER_LABEL, TRIBE_JOIN_CTA, TRIBE_LEAVE_CONFIRM, TRIBE_LEAVE_CTA } from "@yunicity/utils";
import Link from "next/link";
import { useState } from "react";

import { yunicityBtnPrimary } from "@/lib/brand-classes";
import { TribeJoinRequestButton } from "@/components/tribes/tribe-join-request-button";
import { TribeMuteToggle } from "@/components/tribes/tribe-mute-toggle";

export function TribeActions({
  tribe,
  joining,
  leaving,
  actionError,
  onJoin,
  onLeave,
  isAuthenticated,
}: {
  tribe: Tribe;
  joining: boolean;
  leaving: boolean;
  actionError: string | null;
  onJoin: (charterAccepted: boolean) => Promise<void>;
  onLeave: () => Promise<void>;
  isAuthenticated: boolean;
}) {
  const [charterAccepted, setCharterAccepted] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (tribe.is_archived) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-neutral-600">
        <Link href="/login" className="font-medium text-yunicity-primary hover:underline">
          Connectez-vous
        </Link>{" "}
        pour rejoindre cette tribu.
      </p>
    );
  }

  if (tribe.viewer_is_member) {
    if (!confirmLeave) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmLeave(true)}
            disabled={leaving}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {TRIBE_LEAVE_CTA}
          </button>
          <TribeMuteToggle tribe={tribe} />
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void onLeave()}
          disabled={leaving}
          className="rounded-full border border-neutral-400 px-4 py-2 text-sm text-neutral-800"
        >
          {TRIBE_LEAVE_CONFIRM}
        </button>
        <button
          type="button"
          onClick={() => setConfirmLeave(false)}
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          Annuler
        </button>
      </div>
    );
  }

  if (tribe.visibility === "private_invite") {
    return <TribeJoinRequestButton tribe={tribe} />;
  }

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={charterAccepted}
          onChange={(event) => setCharterAccepted(event.target.checked)}
          className="mt-1"
        />
        <span>{TRIBE_CHARTER_LABEL}</span>
      </label>
      <button
        type="button"
        disabled={joining || !charterAccepted}
        onClick={() => void onJoin(charterAccepted)}
        className={yunicityBtnPrimary}
      >
        {TRIBE_JOIN_CTA}
      </button>
      {actionError ? <p className="text-sm text-red-700">{actionError}</p> : null}
    </div>
  );
}
