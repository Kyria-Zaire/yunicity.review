"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { TribeDetailMobileFeaturedCard } from "@yunicity/utils";
import { TRIBE_DETAIL_MOBILE_WELCOME_CHARTER_LINK } from "@yunicity/utils";
import { ExternalLink } from "lucide-react";

type TribeDetailMobileWelcomeCardProps = {
  card: TribeDetailMobileFeaturedCard;
  onReadCharter: () => void;
};

export function TribeDetailMobileWelcomeCard({ card, onReadCharter }: TribeDetailMobileWelcomeCardProps) {
  return (
    <article
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-tribe-detail-mobile-welcome=""
    >
      <header className="flex items-center gap-2.5">
        <ProfileAvatar name={card.authorLabel} size="sm" />
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-neutral-900">{card.authorLabel}</p>
      </header>

      <h3 className="mt-4 text-base font-bold text-neutral-900">{card.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">{card.body}</p>

      <button
        type="button"
        onClick={onReadCharter}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
      >
        {TRIBE_DETAIL_MOBILE_WELCOME_CHARTER_LINK}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </button>
    </article>
  );
}
