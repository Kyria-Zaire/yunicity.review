"use client";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { TribesDesktopInvitationCard } from "@yunicity/utils";
import { TRIBES_DESKTOP_INVITATION_IGNORE, TRIBES_DESKTOP_INVITATION_VIEW } from "@yunicity/utils";
import Link from "next/link";
import { useState } from "react";

type TribesMobileInvitationCardProps = {
  invitation: TribesDesktopInvitationCard | null;
  onDeclined: () => void;
};

export function TribesMobileInvitationCard({ invitation, onDeclined }: TribesMobileInvitationCardProps) {
  if (!invitation) return null;

  return (
    <article
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-tribes-mobile-invitation=""
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FF] text-sm font-bold text-yunicity-primary">
          {invitation.tribeName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-neutral-700">
            {invitation.sourceLabel} vous invite dans{" "}
            <span className="font-bold text-neutral-900">{invitation.tribeName}</span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href={invitation.href}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-yunicity-primary/30 px-3 text-sm font-semibold text-yunicity-primary"
            >
              {TRIBES_DESKTOP_INVITATION_VIEW}
            </Link>
            <DeclineButton invitationId={invitation.id} onDeclined={onDeclined} />
          </div>
        </div>
      </div>
    </article>
  );
}

function DeclineButton({ invitationId, onDeclined }: { invitationId: string; onDeclined: () => void }) {
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
      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600 disabled:opacity-60"
    >
      {TRIBES_DESKTOP_INVITATION_IGNORE}
    </button>
  );
}
