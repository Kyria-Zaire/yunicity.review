"use client";

import type { Tribe } from "@yunicity/types";
import {
  TRIBE_CHARTER_LABEL,
  TRIBE_DETAIL_MOBILE_JOIN_CTA,
  TRIBE_DETAIL_MOBILE_MEMBER_CTA,
  TRIBE_LEAVE_CTA,
} from "@yunicity/utils";
import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TribeDetailMobileMembershipActionProps = {
  tribe: Tribe;
  isAuthenticated: boolean;
  joining: boolean;
  leaving: boolean;
  actionError: string | null;
  onJoin: (accepted: boolean) => Promise<void>;
  onLeave: () => Promise<void>;
};

/** Bouton adhésion compact hero mobile tribu (MOBILE-TRIBE-DETAIL-01). */
export function TribeDetailMobileMembershipAction({
  tribe,
  isAuthenticated,
  joining,
  leaving,
  actionError,
  onJoin,
  onLeave,
}: TribeDetailMobileMembershipActionProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [charterAccepted, setCharterAccepted] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  if (tribe.is_archived || tribe.visibility === "private_invite") {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-900 shadow-md"
      >
        {TRIBE_DETAIL_MOBILE_JOIN_CTA}
      </Link>
    );
  }

  if (tribe.viewer_is_member) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-900 shadow-md"
          aria-expanded={menuOpen}
        >
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
          {TRIBE_DETAIL_MOBILE_MEMBER_CTA}
          <ChevronDown className="h-4 w-4 text-neutral-500" aria-hidden />
        </button>
        {menuOpen ? (
          <div className="absolute bottom-full right-0 z-10 mb-2 min-w-[10rem] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              disabled={leaving}
              onClick={() => {
                setMenuOpen(false);
                void onLeave();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
            >
              {TRIBE_LEAVE_CTA}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (showJoinForm) {
    return (
      <div className="max-w-[14rem] rounded-xl bg-white/95 p-3 shadow-md backdrop-blur-sm">
        <label className="flex items-start gap-2 text-[11px] leading-snug text-neutral-700">
          <input
            type="checkbox"
            checked={charterAccepted}
            onChange={(event) => setCharterAccepted(event.target.checked)}
            className="mt-0.5"
          />
          <span>{TRIBE_CHARTER_LABEL}</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={joining || !charterAccepted}
            onClick={() => void onJoin(charterAccepted)}
            className="rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {TRIBE_DETAIL_MOBILE_JOIN_CTA}
          </button>
          <button
            type="button"
            onClick={() => setShowJoinForm(false)}
            className="text-xs text-neutral-500"
          >
            Annuler
          </button>
        </div>
        {actionError ? <p className="mt-2 text-[11px] text-red-700">{actionError}</p> : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowJoinForm(true)}
      className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-900 shadow-md"
    >
      {TRIBE_DETAIL_MOBILE_JOIN_CTA}
    </button>
  );
}
