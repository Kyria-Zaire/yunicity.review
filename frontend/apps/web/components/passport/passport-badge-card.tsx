"use client";

import type { PassportBadgeResponse } from "@yunicity/types";
import { formatPassportDate } from "@yunicity/utils";

type PassportBadgeCardProps = {
  badge: PassportBadgeResponse;
  variant: "earned" | "locked";
};

function rarityTone(rarity: string): string {
  if (rarity === "legendary") return "border-amber-300 bg-amber-50 text-amber-800";
  if (rarity === "epic") return "border-violet-300 bg-violet-50 text-violet-800";
  if (rarity === "rare") return "border-sky-300 bg-sky-50 text-sky-800";
  return "border-neutral-200 bg-neutral-50 text-neutral-600";
}

export function PassportBadgeCard({ badge, variant }: PassportBadgeCardProps) {
  const isEarned = variant === "earned";

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm ${
        isEarned ? "border-neutral-200/90 bg-white" : "border-dashed border-neutral-200 bg-neutral-50/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-neutral-900">{badge.name}</h3>
          <p className="mt-1 text-sm text-neutral-600">{badge.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${rarityTone(badge.rarity)}`}
        >
          {badge.rarity}
        </span>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        {isEarned && badge.earned_at
          ? `Obtenu le ${formatPassportDate(badge.earned_at)}`
          : "À débloquer en participant sur le territoire"}
      </p>
    </article>
  );
}
