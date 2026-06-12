"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PassportDerivedBadge, ProfileNeighborhoodCard, ProfileTribeCard } from "@yunicity/utils";
import {
  PROFILE_PORTAL_BADGES_CTA,
  PROFILE_PORTAL_BADGES_TITLE,
  PROFILE_PORTAL_NEIGHBORHOODS_CTA,
  PROFILE_PORTAL_NEIGHBORHOODS_TITLE,
  PROFILE_PORTAL_TRIBES_CTA,
  PROFILE_PORTAL_TRIBES_TITLE,
  TRIBES_PORTAL_MEMBERS_LABEL,
} from "@yunicity/utils";
import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";

type ProfileWidgetsColumnProps = {
  city: string;
  neighborhoodCards: ProfileNeighborhoodCard[];
  tribeCards: ProfileTribeCard[];
  badges: PassportDerivedBadge[];
};

const BADGE_TONE: Record<string, string> = {
  curious_explorer: "border-orange-300 bg-orange-50 text-orange-700",
  engaged_sharer: "border-sky-300 bg-sky-50 text-sky-700",
  connector: "border-violet-300 bg-violet-50 text-violet-700",
  local_supporter: "border-rose-300 bg-rose-50 text-rose-700",
  ambiance_maker: "border-pink-300 bg-pink-50 text-pink-700",
};

export function ProfileWidgetsColumn({
  city,
  neighborhoodCards,
  tribeCards,
  badges,
}: ProfileWidgetsColumnProps) {
  return (
    <div className="space-y-5">
      <section
        id="profile-favorites"
        className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-neutral-900">{PROFILE_PORTAL_NEIGHBORHOODS_TITLE}</h2>
          <Link
            href={`/neighborhoods?city=${encodeURIComponent(city)}`}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_PORTAL_NEIGHBORHOODS_CTA}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {neighborhoodCards.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Explorez la carte pour découvrir les quartiers de votre ville.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {neighborhoodCards.map((card) => (
              <li key={card.id}>
                <Link
                  href={card.href}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-xl"
                >
                  <CulturalImage
                    src={card.imageUrl}
                    alt={card.name}
                    placeName={card.name}
                    className="absolute inset-0 size-full"
                    imageClassName="transition duration-300 group-hover:scale-[1.03]"
                    sizes="160px"
                    showFallbackCaption={false}
                    overlay={false}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"
                    aria-hidden
                  />
                  <span className="absolute inset-x-0 bottom-0 p-2 text-xs font-semibold text-white">
                    {card.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id="profile-tribes"
        className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-neutral-900">{PROFILE_PORTAL_TRIBES_TITLE}</h2>
          <Link
            href={`/tribes?city=${encodeURIComponent(city)}&view=mine`}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_PORTAL_TRIBES_CTA}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {tribeCards.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Rejoignez une tribu pour rencontrer des habitants de votre ville.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tribeCards.map((card) => (
              <li key={card.id}>
                <Link
                  href={card.href}
                  className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-neutral-50"
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                    <CulturalImage
                      src={card.imageUrl}
                      alt={card.name}
                      placeName={card.name}
                      className="size-full"
                      sizes="44px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{card.name}</p>
                    <p className="text-xs text-neutral-500">
                      {TRIBES_PORTAL_MEMBERS_LABEL(card.memberCount)}
                    </p>
                  </div>
                  <p className="max-w-[40%] shrink-0 text-right text-[11px] leading-snug text-neutral-500">
                    <Users className="mb-0.5 inline h-3 w-3 opacity-60" aria-hidden />{" "}
                    {card.statusLine}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id="profile-badges"
        className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-neutral-900">{PROFILE_PORTAL_BADGES_TITLE}</h2>
          <Link
            href="/passport"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_PORTAL_BADGES_CTA}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {badges.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Activez votre passport pour débloquer vos premiers badges.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap justify-between gap-3">
            {badges.map((badge) => (
              <li key={badge.id} className="flex w-[4.5rem] flex-col items-center gap-1.5 text-center">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-[10px] font-bold uppercase leading-tight ${
                    badge.earned
                      ? BADGE_TONE[badge.id] ?? "border-neutral-300 bg-neutral-50 text-neutral-700"
                      : "border-neutral-200 bg-neutral-50 text-neutral-400"
                  }`}
                  style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
                >
                  <span className="px-1">{badge.earned ? "✓" : "…"}</span>
                </span>
                <span className="line-clamp-2 text-[10px] font-medium leading-snug text-neutral-600">
                  {badge.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
