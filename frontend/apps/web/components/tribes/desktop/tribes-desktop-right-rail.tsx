"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type {
  TribesDesktopInvitationCard,
  TribesDesktopMyTribeRow,
  TribesDesktopNearbyRow,
} from "@yunicity/utils";
import {
  TRIBES_DESKTOP_GET_STARTED_GUIDE,
  TRIBES_DESKTOP_GET_STARTED_PRIVACY,
  TRIBES_DESKTOP_GET_STARTED_REPORT,
  TRIBES_DESKTOP_GET_STARTED_RULES,
  TRIBES_DESKTOP_GET_STARTED_TITLE,
  TRIBES_DESKTOP_INVITATIONS_EMPTY,
  TRIBES_DESKTOP_INVITATIONS_TITLE,
  TRIBES_DESKTOP_INVITATIONS_VIEW_ALL,
  TRIBES_DESKTOP_INVITATION_FROM,
  TRIBES_DESKTOP_INVITATION_IGNORE,
  TRIBES_DESKTOP_INVITATION_VIEW,
  TRIBES_DESKTOP_NEARBY_SUBTITLE,
  TRIBES_DESKTOP_NEARBY_TITLE,
  TRIBES_DESKTOP_YOUR_TRIBES_CTA,
  TRIBES_DESKTOP_YOUR_TRIBES_EMPTY,
  TRIBES_DESKTOP_YOUR_TRIBES_TITLE,
} from "@yunicity/utils";
import { CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TribesDesktopRightRailProps = {
  city: string;
  neighborhoodLabel: string;
  myTribes: TribesDesktopMyTribeRow[];
  invitations: TribesDesktopInvitationCard[];
  nearbyRows: TribesDesktopNearbyRow[];
  onInvitationDeclined: () => void;
};

export function TribesDesktopRightRail({
  city,
  neighborhoodLabel,
  myTribes,
  invitations,
  nearbyRows,
  onInvitationDeclined,
}: TribesDesktopRightRailProps) {
  return (
    <aside className="tribes-desktop-right-rail" aria-label="Votre espace tribus" data-tribes-desktop-right-rail="">
      <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="tribes-your-tribes-title">
        <h2
          id="tribes-your-tribes-title"
          className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
        >
          {TRIBES_DESKTOP_YOUR_TRIBES_TITLE}
        </h2>

        {myTribes.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {myTribes.map((row) => (
              <li key={row.id}>
                <Link href={row.href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                    <CulturalImage
                      src={row.imageUrl}
                      alt=""
                      placeName={row.name}
                      className="absolute inset-0 size-full"
                      sizes="40px"
                      showFallbackCaption={false}
                      dimOverlay={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{row.name}</p>
                    <p className="truncate text-xs text-neutral-500">{row.statusLine}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-neutral-500">{TRIBES_DESKTOP_YOUR_TRIBES_EMPTY}</p>
        )}

        <div className="border-t border-neutral-100 p-3">
          <Link
            href={`/tribes?city=${encodeURIComponent(city)}&view=mine`}
            className="inline-flex w-full items-center justify-center rounded-xl border border-yunicity-primary/30 px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary hover:bg-[#EEF0FF]"
          >
            {TRIBES_DESKTOP_YOUR_TRIBES_CTA}
          </Link>
        </div>
      </section>

      <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="tribes-invitations-title">
        <h2
          id="tribes-invitations-title"
          className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
        >
          {TRIBES_DESKTOP_INVITATIONS_TITLE}
        </h2>

        {invitations.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="p-4">
                <p className="text-xs font-medium text-neutral-500">
                  {TRIBES_DESKTOP_INVITATION_FROM(invitation.sourceLabel)}
                </p>
                <p className="mt-1 text-sm font-bold text-neutral-900">{invitation.tribeName}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={invitation.href}
                    className="text-sm font-semibold text-yunicity-primary hover:underline"
                  >
                    {TRIBES_DESKTOP_INVITATION_VIEW}
                  </Link>
                  <TribesDesktopDeclineInvitationButton
                    invitationId={invitation.id}
                    onDeclined={onInvitationDeclined}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-neutral-500">{TRIBES_DESKTOP_INVITATIONS_EMPTY}</p>
        )}

        <div className="border-t border-neutral-100 p-3">
          <Link
            href={`/tribes?city=${encodeURIComponent(city)}&view=invitations`}
            className="inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBES_DESKTOP_INVITATIONS_VIEW_ALL}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="tribes-nearby-title">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 id="tribes-nearby-title" className="text-sm font-bold text-neutral-900">
            {TRIBES_DESKTOP_NEARBY_TITLE}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            {TRIBES_DESKTOP_NEARBY_SUBTITLE(neighborhoodLabel)}
          </p>
        </div>

        {nearbyRows.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {nearbyRows.map((row) => (
              <li key={row.id}>
                <Link href={row.href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                    <CulturalImage
                      src={row.imageUrl}
                      alt=""
                      placeName={row.name}
                      className="absolute inset-0 size-full"
                      sizes="36px"
                      showFallbackCaption={false}
                      dimOverlay={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{row.name}</p>
                    <p className="truncate text-xs text-neutral-500">{row.metaLine}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-neutral-500">Aucune suggestion locale pour le moment.</p>
        )}
      </section>

      <section className="feed-desktop-surface overflow-hidden" aria-labelledby="tribes-get-started-title">
        <div className="flex items-start gap-2 border-b border-neutral-100 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-yunicity-primary" aria-hidden />
          <h2 id="tribes-get-started-title" className="text-sm font-bold text-neutral-900">
            {TRIBES_DESKTOP_GET_STARTED_TITLE}
          </h2>
        </div>
        <ul className="space-y-2 p-4">
          {[TRIBES_DESKTOP_GET_STARTED_RULES, TRIBES_DESKTOP_GET_STARTED_PRIVACY, TRIBES_DESKTOP_GET_STARTED_REPORT].map(
            (label) => (
              <li key={label} className="flex items-center gap-2 text-sm text-neutral-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                {label}
              </li>
            ),
          )}
        </ul>
        <div className="border-t border-neutral-100 p-3">
          <Link
            href="/help/tribes"
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBES_DESKTOP_GET_STARTED_GUIDE}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </aside>
  );
}

function TribesDesktopDeclineInvitationButton({
  invitationId,
  onDeclined,
}: {
  invitationId: string;
  onDeclined: () => void;
}) {
  const api = useYunicityApi();
  const [pending, setPending] = useState(false);

  async function handleDecline() {
    setPending(true);
    try {
      await api.tribes.declineTribeInvitation(invitationId);
      onDeclined();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void handleDecline()}
      className="text-sm font-medium text-neutral-500 hover:text-neutral-800 disabled:opacity-60"
    >
      {TRIBES_DESKTOP_INVITATION_IGNORE}
    </button>
  );
}
