"use client";

import type { Tribe } from "@yunicity/types";
import {
  TRIBE_DETAIL_MOBILE_CHARTER_CHECK,
  TRIBE_DETAIL_MOBILE_JOIN,
  TRIBE_DETAIL_MOBILE_JOIN_CARD_BODY,
  TRIBE_DETAIL_MOBILE_READ_CHARTER,
  formatTribeDetailMobileJoinCardTitle,
} from "@yunicity/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TribeDetailMobileJoinCardProps = {
  tribe: Tribe;
  city: string;
  joining: boolean;
  actionError: string | null;
  isAuthenticated: boolean;
  onJoin: (accepted: boolean) => Promise<void>;
  onReadCharter: () => void;
};

export function TribeDetailMobileJoinCard({
  tribe,
  city,
  joining,
  actionError,
  isAuthenticated,
  onJoin,
  onReadCharter,
}: TribeDetailMobileJoinCardProps) {
  const [charterAccepted, setCharterAccepted] = useState(false);
  const loginNext = `/tribes/${encodeURIComponent(tribe.slug)}?city=${encodeURIComponent(city)}`;

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-tribe-detail-mobile-join-card=""
    >
      <h2 className="text-base font-bold text-neutral-900">
        {formatTribeDetailMobileJoinCardTitle(tribe.name)}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600">
        {TRIBE_DETAIL_MOBILE_JOIN_CARD_BODY}
      </p>

      <label className="mt-4 flex items-start gap-2.5 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={charterAccepted}
          onChange={(event) => setCharterAccepted(event.target.checked)}
          className="mt-0.5"
        />
        <span>{TRIBE_DETAIL_MOBILE_CHARTER_CHECK}</span>
      </label>

      <button
        type="button"
        onClick={onReadCharter}
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {TRIBE_DETAIL_MOBILE_READ_CHARTER}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </button>

      <div className="mt-4">
        {!isAuthenticated ? (
          <Link
            href={`/login?next=${encodeURIComponent(loginNext)}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-6 text-sm font-semibold text-white"
          >
            {TRIBE_DETAIL_MOBILE_JOIN}
          </Link>
        ) : (
          <button
            type="button"
            disabled={joining || !charterAccepted}
            onClick={() => void onJoin(charterAccepted)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-6 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
          >
            {joining ? "…" : TRIBE_DETAIL_MOBILE_JOIN}
          </button>
        )}
        {actionError ? <p className="mt-2 text-xs text-red-700">{actionError}</p> : null}
      </div>
    </section>
  );
}
