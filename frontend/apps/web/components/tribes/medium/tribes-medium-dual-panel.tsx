"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { TribesDesktopInvitationCard, TribesDesktopMyTribeRow } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_INVITATIONS_EMPTY,
  TRIBES_DESKTOP_INVITATIONS_TITLE,
  TRIBES_DESKTOP_INVITATIONS_VIEW_ALL,
  TRIBES_DESKTOP_INVITATION_FROM,
  TRIBES_DESKTOP_INVITATION_IGNORE,
  TRIBES_DESKTOP_INVITATION_VIEW,
  TRIBES_DESKTOP_YOUR_TRIBES_CTA,
  TRIBES_DESKTOP_YOUR_TRIBES_EMPTY,
  TRIBES_DESKTOP_YOUR_TRIBES_TITLE,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TribesMediumDualPanelProps = {
  city: string;
  myTribes: TribesDesktopMyTribeRow[];
  invitations: TribesDesktopInvitationCard[];
  onInvitationDeclined: () => void;
};

export function TribesMediumDualPanel({
  city,
  myTribes,
  invitations,
  onInvitationDeclined,
}: TribesMediumDualPanelProps) {
  const featuredInvitation = invitations[0];

  return (
    <div className="tribes-medium-dual-panel grid gap-4 sm:grid-cols-2" data-tribes-medium-dual-panel="">
      <section className="feed-desktop-surface overflow-hidden" aria-labelledby="tribes-medium-your-tribes-title">
        <h2
          id="tribes-medium-your-tribes-title"
          className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
        >
          {TRIBES_DESKTOP_YOUR_TRIBES_TITLE}
        </h2>

        {myTribes.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {myTribes.slice(0, 3).map((row) => (
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

      <section className="feed-desktop-surface overflow-hidden" aria-labelledby="tribes-medium-invitations-title">
        <h2
          id="tribes-medium-invitations-title"
          className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
        >
          {TRIBES_DESKTOP_INVITATIONS_TITLE}
        </h2>

        {featuredInvitation ? (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FF] text-sm font-bold text-yunicity-primary">
                {featuredInvitation.tribeName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-neutral-700">
                  {TRIBES_DESKTOP_INVITATION_FROM(featuredInvitation.sourceLabel)}{" "}
                  <span className="font-bold text-neutral-900">{featuredInvitation.tribeName}</span>
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={featuredInvitation.href}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-yunicity-primary/30 px-3 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary hover:bg-[#EEF0FF]"
                  >
                    {TRIBES_DESKTOP_INVITATION_VIEW}
                  </Link>
                  <TribesMediumDeclineInvitationButton
                    invitationId={featuredInvitation.id}
                    onDeclined={onInvitationDeclined}
                  />
                </div>
              </div>
            </div>
          </div>
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
    </div>
  );
}

function TribesMediumDeclineInvitationButton({
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
      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 disabled:opacity-60"
    >
      {TRIBES_DESKTOP_INVITATION_IGNORE}
    </button>
  );
}
