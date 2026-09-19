"use client";

import type { ProfileDesktopProfile } from "@/components/profile/desktop/profile-desktop-profile";
import type { ProfileDesktopTribeRailItem } from "@yunicity/utils";
import {
  INTEREST_LABELS,
  PROFILE_DESKTOP_ABOUT_INTERESTS,
  PROFILE_DESKTOP_ABOUT_TITLE,
  PROFILE_DESKTOP_INTEREST_TONE,
  PROFILE_DESKTOP_LOCAL_CITY,
  PROFILE_DESKTOP_PUBLIC_TRIBES_CTA,
  PROFILE_DESKTOP_PUBLIC_TRIBES_TITLE,
  PROFILE_DESKTOP_TRIBES_EMPTY,
  formatProfileDesktopMemberSince,
} from "@yunicity/utils";
import {
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Gamepad2,
  Laptop,
  MapPin,
  Music,
  Palette,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const TONE_CLASS = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  sky: "bg-cyan-100 text-cyan-700",
  neutral: "bg-neutral-100 text-neutral-700",
} as const;

const INTEREST_ICON: Record<string, LucideIcon> = {
  culture: Building2,
  art: Palette,
  music: Music,
  tech: Laptop,
  gaming: Gamepad2,
  entrepreneurship: Briefcase,
  business: Briefcase,
  food: Utensils,
  nightlife: Users,
  sports: Dumbbell,
  fitness: Dumbbell,
  photography: Palette,
};

type ProfileDesktopPublicSidebarProps = {
  profile: ProfileDesktopProfile;
  city: string;
  tribeItems: ProfileDesktopTribeRailItem[];
};

/** Rail droit profil public — À propos · intérêts · tribus (maquette). */
export function ProfileDesktopPublicSidebar({
  profile,
  city,
  tribeItems,
}: ProfileDesktopPublicSidebarProps) {
  const memberSince = profile.created_at
    ? formatProfileDesktopMemberSince(profile.created_at)
    : null;
  const memberSinceShort = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <aside className="space-y-4" data-profile-desktop-public-sidebar="">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_DESKTOP_ABOUT_TITLE}</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2 text-neutral-500">
              <MapPin className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
              {PROFILE_DESKTOP_LOCAL_CITY}
            </dt>
            <dd className="font-semibold text-neutral-900">{city}</dd>
          </div>
          {memberSince ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="inline-flex items-center gap-2 text-neutral-500">
                <CalendarDays className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
                Membre depuis
              </dt>
              <dd className="font-semibold text-neutral-900">{memberSinceShort}</dd>
            </div>
          ) : null}
        </dl>
        {memberSince ? <p className="mt-3 text-xs text-neutral-500">{memberSince}</p> : null}
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_DESKTOP_ABOUT_INTERESTS}</h2>
        {profile.interests.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {profile.interests.slice(0, 4).map((tag) => {
              const tone = PROFILE_DESKTOP_INTEREST_TONE[tag] ?? "neutral";
              const Icon = INTEREST_ICON[tag] ?? Users;
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold ${TONE_CLASS[tone]}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {INTEREST_LABELS[tag] ?? tag}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">Aucun centre d&apos;intérêt renseigné.</p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_DESKTOP_PUBLIC_TRIBES_TITLE}</h2>
        {tribeItems.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{PROFILE_DESKTOP_TRIBES_EMPTY}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {tribeItems.slice(0, 3).map((tribe, index) => (
              <li key={tribe.id} className="flex items-center gap-2.5">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    index % 2 === 0 ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" aria-hidden />
                </span>
                <Link
                  href={tribe.href}
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900 hover:text-yunicity-primary"
                >
                  {tribe.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/tribes?city=${encodeURIComponent(city)}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PROFILE_DESKTOP_PUBLIC_TRIBES_CTA}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </aside>
  );
}
